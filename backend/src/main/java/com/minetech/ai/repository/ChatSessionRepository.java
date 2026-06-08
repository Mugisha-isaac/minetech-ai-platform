package com.minetech.ai.repository;

import com.minetech.ai.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {
    List<ChatSession> findAllByOrderByCreatedAtDesc();
}

