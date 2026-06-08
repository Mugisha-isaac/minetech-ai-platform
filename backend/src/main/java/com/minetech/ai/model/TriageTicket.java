package com.minetech.ai.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "triage_tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TriageTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "raw_input", nullable = false, columnDefinition = "TEXT")
    private String rawInput;

    @Column(name = "category")
    private String category;

    @Column(name = "priority")
    private String priority;

    @Column(name = "location")
    private String location;

    @Column(name = "affected_system")
    private String affectedSystem;

    @Column(name = "reported_by")
    private String reportedBy;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "suggested_reply", columnDefinition = "TEXT")
    private String suggestedReply;

    @Column(name = "raw_llm_output", columnDefinition = "TEXT")
    private String rawLlmOutput;

    @Column(name = "parse_error", columnDefinition = "TEXT")
    private String parseError;

    @Column(name = "status")
    @Builder.Default
    private String status = "PENDING";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
