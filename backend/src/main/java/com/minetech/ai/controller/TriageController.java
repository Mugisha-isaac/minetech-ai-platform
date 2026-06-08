package com.minetech.ai.controller;

import com.minetech.ai.dto.TriageDtos.*;
import com.minetech.ai.service.TriageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/triage")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TriageController {

    private final TriageService triageService;

    @PostMapping
    public ResponseEntity<TriageResponse> submitTicket(@RequestBody TriageRequest request) {
        return ResponseEntity.ok(triageService.processTicket(request.getText()));
    }

    @GetMapping
    public ResponseEntity<List<TriageResponse>> getTickets(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String priority) {
        return ResponseEntity.ok(triageService.getTickets(category, priority));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(triageService.getCategories());
    }
}
