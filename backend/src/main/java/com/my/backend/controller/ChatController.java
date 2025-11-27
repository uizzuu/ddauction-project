package com.my.backend.controller;

import com.my.backend.dto.RAGRequest;
import com.my.backend.dto.RAGResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    @Value("${rag.api.url}")
    private String ragApiUrl;

    private final RestTemplate restTemplate;

    @PostMapping("/query")
    public ResponseEntity<RAGResponse> query(@RequestBody RAGRequest request) {
        try {
            log.info("RAG 질의 요청: {}", request.getQuery());

            String url = ragApiUrl + "/rag/query";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<RAGRequest> entity = new HttpEntity<>(request, headers);

            RAGResponse response = restTemplate.postForObject(
                    url,
                    entity,
                    RAGResponse.class
            );

            log.info("RAG 응답 성공");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("RAG 질의 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Chat service is running");
    }
}