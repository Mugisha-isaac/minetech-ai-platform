package com.minetech.ai.config;

import com.minetech.ai.model.KbDocument;
import com.minetech.ai.repository.KbDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final KbDocumentRepository documentRepository;
    private final VectorStore vectorStore;

    @Override
    public void run(ApplicationArguments args) {
        try {
            // Check if vector_store already has data
            List<Document> existing = vectorStore.similaritySearch(SearchRequest.builder().query("safety").topK(1).build());

            if (!existing.isEmpty()) {
                log.info("Vector store already populated ({} results for test query) — skipping auto-embed.", existing.size());
                return;
            }

            List<KbDocument> docs = documentRepository.findAll();
            if (docs.isEmpty()) {
                log.info("No KB documents found to embed.");
                return;
            }

            log.info("Vector store is empty — embedding {} KB document(s)...", docs.size());

            for (KbDocument doc : docs) {
                try {
                    List<String> chunks = chunkText(doc.getContent());
                    List<Document> documents = new ArrayList<>();

                    for (int i = 0; i < chunks.size(); i++) {
                        documents.add(Document.builder()
                                .text(chunks.get(i))
                                .metadata(Map.of(
                                        "document_id",    doc.getId(),
                                        "document_title", doc.getTitle(),
                                        "chunk_index",    i))
                                .build());
                    }

                    vectorStore.add(documents);
                    log.info("Embedded '{}' → {} chunk(s)", doc.getTitle(), chunks.size());

                } catch (Exception e) {
                    log.error("Failed to embed '{}': {}", doc.getTitle(), e.getMessage());
                }
            }

            log.info("Auto-embed complete.");

        } catch (Exception e) {
            log.warn("DataInitializer failed (non-fatal): {}", e.getMessage());
        }
    }

    private List<String> chunkText(String text) {
        List<String> chunks = new ArrayList<>();
        String[] paragraphs = text.split("\n\n+");
        StringBuilder current = new StringBuilder();

        for (String para : paragraphs) {
            if (current.length() + para.length() > 500 && !current.isEmpty()) {
                chunks.add(current.toString().trim());
                current = new StringBuilder();
            }
            current.append(para).append("\n\n");
        }
        if (!current.isEmpty()) chunks.add(current.toString().trim());
        return chunks;
    }
}