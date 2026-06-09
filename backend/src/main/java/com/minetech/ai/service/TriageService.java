package com.minetech.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minetech.ai.dto.TriageDtos.*;
import com.minetech.ai.model.TriageTicket;
import com.minetech.ai.repository.TriageTicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TriageService {

    private final ChatModel chatModel;
    private final TriageTicketRepository repository;
    private final ObjectMapper objectMapper;


    private static final String TRIAGE_PROMPT = """
            You are an AI assistant for a mining operations platform. Analyze the following support ticket or incident report and return a JSON object ONLY — no explanation, no markdown, no extra text.

            The JSON must have exactly these fields (example):
            category: one of ["Equipment Failure", "Safety Incident", "Compliance Issue", "Production Delay", "Environmental", "IT/System", "General"]
            priority: one of ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
            location: the site/zone mentioned or null if not specified
            affectedSystem: the equipment or system affected or null
            reportedBy: the person's name if mentioned or null
            summary: a 1-2 sentence summary of the issue
            suggestedReply: a professional 2-3 sentence response acknowledging the issue and stating next steps

            Priority guidance:
            - CRITICAL: immediate safety risk or complete production stoppage
            - HIGH: major equipment failure, significant production impact
            - MEDIUM: partial degradation, workaround possible
            - LOW: informational, routine, or minor

            Ticket text:
            {ticketText}

            Return only valid JSON with these exact field names:
            """;

    public TriageResponse processTicket(String rawInput) {
        TriageTicket ticket = repository.save(TriageTicket.builder()
                .rawInput(rawInput)
                .status("PENDING")
                .build());

        try {
            String llmOutput = callLlm(rawInput);
            ticket.setRawLlmOutput(llmOutput);

            TriageResult parsed = parseJson(llmOutput);
            ticket.setCategory(parsed.getCategory());
            ticket.setPriority(parsed.getPriority());
            ticket.setLocation(parsed.getLocation());
            ticket.setAffectedSystem(parsed.getAffectedSystem());
            ticket.setReportedBy(parsed.getReportedBy());
            ticket.setSummary(parsed.getSummary());
            ticket.setSuggestedReply(parsed.getSuggestedReply());
            ticket.setStatus("PROCESSED");

        } catch (Exception e) {
            log.error("Failed to parse LLM output for ticket {}: {}", ticket.getId(), e.getMessage());
            ticket.setStatus("PARSE_ERROR");
            ticket.setParseError(e.getMessage());
        }

        ticket = repository.save(ticket);
        return toResponse(ticket);
    }

    public List<TriageResponse> getTickets(String category, String priority) {
        List<TriageTicket> tickets;

        if (category != null && priority != null) {
            tickets = repository.findByCategoryIgnoreCaseAndPriorityOrderByCreatedAtDesc(category, priority);
        } else if (category != null) {
            tickets = repository.findByCategoryIgnoreCaseOrderByCreatedAtDesc(category);
        } else if (priority != null) {
            tickets = repository.findByPriorityOrderByCreatedAtDesc(priority);
        } else {
            tickets = repository.findByOrderByCreatedAtDesc();
        }

        return tickets.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<String> getCategories() {
        return repository.findDistinctCategories();
    }


    private String callLlm(String ticketText) {
        PromptTemplate template = new PromptTemplate(TRIAGE_PROMPT);
        Prompt prompt = template.create(Map.of("ticketText", ticketText));
        return chatModel.call(prompt).getResult().getOutput().getText();
    }

    private TriageResult parseJson(String llmOutput) throws Exception {
        String cleaned = llmOutput.trim();
        try {
            return objectMapper.readValue(cleaned, TriageResult.class);
        } catch (Exception e1) {
            log.debug("Direct parse failed, trying JSON extraction: {}", e1.getMessage());
        }

        Pattern jsonPattern = Pattern.compile("\\{[\\s\\S]*}", Pattern.MULTILINE);
        Matcher matcher = jsonPattern.matcher(cleaned);
        if (matcher.find()) {
            try {
                return objectMapper.readValue(matcher.group(), TriageResult.class);
            } catch (Exception e2) {
                log.debug("JSON extraction parse failed: {}", e2.getMessage());
            }
        }

        log.warn("Could not parse structured output — returning partial result");
        return TriageResult.builder()
                .category("General")
                .priority("MEDIUM")
                .summary(cleaned.length() > 300 ? cleaned.substring(0, 300) : cleaned)
                .suggestedReply("Your request has been received and will be reviewed shortly.")
                .build();
    }

    private TriageResponse toResponse(TriageTicket t) {
        return TriageResponse.builder()
                .id(t.getId())
                .rawInput(t.getRawInput())
                .category(t.getCategory())
                .priority(t.getPriority())
                .location(t.getLocation())
                .affectedSystem(t.getAffectedSystem())
                .reportedBy(t.getReportedBy())
                .summary(t.getSummary())
                .suggestedReply(t.getSuggestedReply())
                .status(t.getStatus())
                .parseError(t.getParseError())
                .createdAt(t.getCreatedAt())
                .build();
    }
}