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

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        return ResponseEntity.ok(ragService.chat(request.getSessionId(), request.getMessage()));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<SessionHistoryResponse> getHistory(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(ragService.getHistory(sessionId));
    }

    @PostMapping("/kb")
    public ResponseEntity<KbDocumentDto> uploadDocument(@RequestBody KbUploadRequest request) {
        return ResponseEntity.ok(ragService.addDocument(request.getTitle(), request.getContent()));
    }

    @PostMapping("/kb/upload")
    public ResponseEntity<KbDocumentDto> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title) {
        return ResponseEntity.ok(ragService.addDocumentFromFile(file, title));
    }

    @GetMapping("/kb")
    public ResponseEntity<List<KbDocumentDto>> listDocuments() {
        return ResponseEntity.ok(ragService.listDocuments());
    }

    @DeleteMapping("/kb/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        ragService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
