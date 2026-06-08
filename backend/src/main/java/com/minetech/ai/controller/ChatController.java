package com.minetech.ai.controller;

import com.minetech.ai.dto.ChatDtos.*;
import com.minetech.ai.service.RagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final RagService ragService;

    /** Send a message — creates or continues a chat session */
    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        return ResponseEntity.ok(ragService.chat(request.getSessionId(), request.getMessage()));
    }

    /** Retrieve message history for a session */
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<SessionHistoryResponse> getHistory(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(ragService.getHistory(sessionId));
    }

    /**
     * Upload a knowledge base document by pasting text content (existing endpoint)
     */
    @PostMapping("/kb")
    public ResponseEntity<KbDocumentDto> uploadDocument(@RequestBody KbUploadRequest request) {
        return ResponseEntity.ok(ragService.addDocument(request.getTitle(), request.getContent()));
    }

    /**
     * Upload a file (PDF, TXT, DOCX, MD) — extracts text and embeds into vector store
     */
    @PostMapping("/kb/upload")
    public ResponseEntity<KbDocumentDto> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title) {
        return ResponseEntity.ok(ragService.addDocumentFromFile(file, title));
    }

    /** List all knowledge base documents */
    @GetMapping("/kb")
    public ResponseEntity<List<KbDocumentDto>> listDocuments() {
        return ResponseEntity.ok(ragService.listDocuments());
    }

    /** Delete a knowledge base document */
    @DeleteMapping("/kb/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        ragService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
