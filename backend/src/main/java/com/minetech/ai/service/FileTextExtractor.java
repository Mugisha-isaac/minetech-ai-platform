package com.minetech.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

@Service
@Slf4j
public class FileTextExtractor {

    public String extract(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

        if (filename.endsWith(".pdf")) {
            return extractPdf(file);
        } else if (filename.endsWith(".txt") || filename.endsWith(".md")) {
            return extractPlainText(file);
        } else if (filename.endsWith(".docx")) {
            return extractDocx(file);
        } else {
            log.warn("Unknown file type '{}' — attempting plain text extraction", filename);
            return extractPlainText(file);
        }
    }

    private String extractPdf(MultipartFile file) throws Exception {
        byte[] bytes = file.getInputStream().readAllBytes();
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            if (text == null || text.isBlank()) {
                throw new RuntimeException("PDF appears to be image-based (scanned). Only text-layer PDFs are supported.");
            }
            return text.trim();
        }
    }

    private String extractPlainText(MultipartFile file) throws Exception {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            return reader.lines().collect(Collectors.joining("\n")).trim();
        }
    }

    private String extractDocx(MultipartFile file) throws Exception {
        try (org.apache.poi.xwpf.usermodel.XWPFDocument doc =
                     new org.apache.poi.xwpf.usermodel.XWPFDocument(file.getInputStream())) {
            StringBuilder sb = new StringBuilder();
            doc.getParagraphs().forEach(p -> {
                String text = p.getText();
                if (text != null && !text.isBlank()) {
                    sb.append(text).append("\n\n");
                }
            });
            return sb.toString().trim();
        }
    }
}