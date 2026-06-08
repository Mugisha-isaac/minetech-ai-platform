package com.minetech.ai.repository;

import com.minetech.ai.model.TriageTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TriageTicketRepository extends JpaRepository<TriageTicket, Long> {

    List<TriageTicket> findByOrderByCreatedAtDesc();

    List<TriageTicket> findByCategoryIgnoreCaseOrderByCreatedAtDesc(String category);

    List<TriageTicket> findByPriorityOrderByCreatedAtDesc(String priority);

    List<TriageTicket> findByCategoryIgnoreCaseAndPriorityOrderByCreatedAtDesc(String category, String priority);

    @Query("SELECT DISTINCT t.category FROM TriageTicket t WHERE t.category IS NOT NULL")
    List<String> findDistinctCategories();
}
