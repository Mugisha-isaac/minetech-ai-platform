package com.minetech.ai.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ChatDtos {

    @Data
    public static class ChatRequest {
        private UUID sessionId;
        private String message;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Citation {
        private String documentTitle;
        private int    chunkIndex;
        private String excerpt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageDto {
        private Long          id;
        private String        role;
        private String        content;
        private List<Citation> citations;
        private Boolean       grounded;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatResponse {
        private UUID              sessionId;
        private String            sessionTitle;
        private ChatMessageDto    answer;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionHistoryResponse {
        private UUID                   sessionId;
        private String                 title;
        private List<ChatMessageDto>   messages;
    }

    // Knowledge base upload
    @Data
    public static class KbUploadRequest {
        private String title;
        private String content;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KbDocumentDto {
        private Long   id;
        private String title;
        private String filename;
        private LocalDateTime createdAt;
    }
}
