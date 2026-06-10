package com.minetech.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.minetech.ai.dto.ChatDtos.*;
import com.minetech.ai.model.ChatMessage;
import com.minetech.ai.model.ChatSession;
import com.minetech.ai.model.KbDocument;
import com.minetech.ai.repository.ChatMessageRepository;
import com.minetech.ai.repository.ChatSessionRepository;
import com.minetech.ai.repository.KbDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

import static com.minetech.ai.config.DataInitializer.getStrings;

@Service
@RequiredArgsConstructor
@Slf4j
public class RagService {

    private final ChatModel              chatModel;
    private final VectorStore            vectorStore;
    private final ObjectMapper           objectMapper;
    private final ChatSessionRepository  sessionRepository;
    private final ChatMessageRepository  messageRepository;
    private final KbDocumentRepository   documentRepository;
    private final FileTextExtractor      fileTextExtractor;

    private static final int    TOP_K = 3;

    private static final String RAG_PROMPT = """
            You are a knowledgeable assistant for MineTech mining operations. Answer the user's question based ONLY on the provided context documents below.

            Rules:
            1. Only use information from the context — do not add outside knowledge.
            2. Always cite which document/section your answer comes from.
            3. If the context does not contain enough information to answer, say exactly: "I don't have information about that in the knowledge base."
            4. Be concise and direct.

            Context documents:
            {context}

            User question: {question}

            Answer (with citations):
            """;

    @Transactional
    public ChatResponse chat(UUID sessionId, String userMessage) {
        ChatSession session = (sessionId != null)
                ? sessionRepository.findById(sessionId).orElseGet(this::createSession)
                : createSession();

        messageRepository.save(ChatMessage.builder()
                .session(session)
                .role("USER")
                .content(userMessage)
                .grounded(true)
                .build());

        List<Document> chunks = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(userMessage)
                        .topK(TOP_K)
                        .build());

        log.debug("Retrieved {} chunks for query: {}", chunks.size(), userMessage);

        boolean grounded = !chunks.isEmpty();
        String answerContent;
        List<Citation> citations = new ArrayList<>();

        if (!grounded) {
            answerContent = "I don't have information about that in the knowledge base.";
        } else {
            StringBuilder contextBuilder = new StringBuilder();
            for (int i = 0; i < chunks.size(); i++) {
                Document chunk   = chunks.get(i);
                String docTitle  = (String) chunk.getMetadata().getOrDefault("document_title", "Unknown Document");
                int    chunkIdx  = toInt(chunk.getMetadata().getOrDefault("chunk_index", i));
                String text      = chunk.getText() != null ? chunk.getText() : "";
                String excerpt   = text.length() > 200 ? text.substring(0, 200) + "..." : text;

                contextBuilder.append(String.format("[%d] %s (section %d):\n%s\n\n",
                        i + 1, docTitle, chunkIdx, text));

                citations.add(Citation.builder()
                        .documentTitle(docTitle)
                        .chunkIndex(chunkIdx)
                        .excerpt(excerpt)
                        .build());
            }

            PromptTemplate template = new PromptTemplate(RAG_PROMPT);
            Prompt prompt = template.create(Map.of(
                    "context",  contextBuilder.toString(),
                    "question", userMessage));

            answerContent = chatModel.call(prompt).getResult().getOutput().getText();
        }

        String citationsJson = serializeCitations(citations);
        ChatMessage assistantMsg = messageRepository.save(ChatMessage.builder()
                .session(session)
                .role("ASSISTANT")
                .content(answerContent)
                .citations(citationsJson)
                .grounded(grounded)
                .build());

        return ChatResponse.builder()
                .sessionId(session.getId())
                .sessionTitle(session.getTitle())
                .answer(toMessageDto(assistantMsg, citations))
                .build();
    }

    @Transactional
    public KbDocumentDto addDocument(String title, String content) {
        return embedAndSave(title, null, content);
    }

    @Transactional
    public KbDocumentDto addDocumentFromFile(MultipartFile file, String customTitle) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";
        String title = (customTitle != null && !customTitle.isBlank())
                ? customTitle
                : filename.replaceAll("\\.[^.]+$", "").replace("_", " ").replace("-", " ");

        String content;
        try {
            content = fileTextExtractor.extract(file);
        } catch (Exception e) {
            log.error("Failed to extract text from file '{}': {}", filename, e.getMessage());
            throw new RuntimeException("Could not extract text from file: " + e.getMessage());
        }

        if (content.isBlank()) {
            throw new RuntimeException("File appears to be empty or has no extractable text.");
        }

        log.info("Extracted {} chars from file '{}'", content.length(), filename);
        return embedAndSave(title, filename, content);
    }

    @Transactional
    public void deleteDocument(Long id) {
        KbDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));

        vectorStore.delete(List.of());
        removeChunksFromVectorStore(id);

        documentRepository.delete(doc);
        log.info("Deleted document '{}' (id={})", doc.getTitle(), id);
    }

    public List<KbDocumentDto> listDocuments() {
        return documentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(d -> KbDocumentDto.builder()
                        .id(d.getId())
                        .title(d.getTitle())
                        .filename(d.getFilename())
                        .createdAt(d.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public SessionHistoryResponse getHistory(UUID sessionId) {
        ChatSession session = sessionRepository.findById(sessionId).orElseThrow(() -> new RuntimeException("Session not found"));
        List<ChatMessage> messages = messageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);

        return SessionHistoryResponse.builder()
                .sessionId(session.getId())
                .title(session.getTitle())
                .messages(messages.stream()
                        .map(m -> toMessageDto(m, parseCitations(m.getCitations())))
                        .collect(Collectors.toList()))
                .build();
    }

    private KbDocumentDto embedAndSave(String title, String filename, String content) {
        KbDocument doc = documentRepository.save(KbDocument.builder()
                .title(title)
                .filename(filename)
                .content(content)
                .build());

        List<String> chunks = chunkText(content);
        List<Document> documents = new ArrayList<>();

        for (int i = 0; i < chunks.size(); i++) {
            documents.add(Document.builder()
                    .text(chunks.get(i))
                    .metadata(Map.of(
                            "document_id",    doc.getId(),
                            "document_title", title,
                            "chunk_index",    i))
                    .build());
        }

        vectorStore.add(documents);
        log.info("Embedded '{}' → {} chunk(s)", title, chunks.size());

        return KbDocumentDto.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .filename(doc.getFilename())
                .createdAt(doc.getCreatedAt())
                .build();
    }

    private void removeChunksFromVectorStore(Long documentId) {
        log.warn("Vector store chunk cleanup for document {} requires manual cleanup or JdbcTemplate integration", documentId);
    }

    private ChatSession createSession() {
        return sessionRepository.save(ChatSession.builder()
                .title("New conversation")
                .build());
    }

    private List<String> chunkText(String text) {
        return getStrings(text);
    }

    private int toInt(Object value) {
        if (value instanceof Number n) return n.intValue();
        try { return Integer.parseInt(value.toString()); } catch (Exception e) { return 0; }
    }

    private String serializeCitations(List<Citation> citations) {
        try { return objectMapper.writeValueAsString(citations); }
        catch (Exception e) { return "[]"; }
    }

    private List<Citation> parseCitations(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try { return objectMapper.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return Collections.emptyList(); }
    }

    private ChatMessageDto toMessageDto(ChatMessage m, List<Citation> citations) {
        return ChatMessageDto.builder()
                .id(m.getId())
                .role(m.getRole())
                .content(m.getContent())
                .citations(citations)
                .grounded(m.getGrounded())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
