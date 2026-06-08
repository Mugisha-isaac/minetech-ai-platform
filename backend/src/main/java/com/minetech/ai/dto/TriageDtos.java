package com.minetech.ai.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


public class TriageDtos {

    @Data
    public static class TriageRequest {
        private String text;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TriageResult {
        private String category;
        private String priority;
        private String location;
        private String affectedSystem;
        private String reportedBy;
        private String summary;
        private String suggestedReply;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TriageResponse {
        private Long id;
        private String rawInput;
        private String category;
        private String priority;
        private String location;
        private String affectedSystem;
        private String reportedBy;
        private String summary;
        private String suggestedReply;
        private String status;
        private String parseError;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TriageListResponse {
        private List<TriageResponse> tickets;
        private long total;
    }
}
