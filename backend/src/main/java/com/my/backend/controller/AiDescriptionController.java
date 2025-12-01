package com.my.backend.controller;

import com.my.backend.dto.AiDescriptionRequest;
import com.my.backend.dto.AiDescriptionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiDescriptionController {

    @Value("${rag.api.url}")
    private String ragApiUrl;

    private final RestTemplate restTemplate;

    /**
     * AI 상품 설명 생성 API
     * Python FastAPI의 /generate-description 엔드포인트 호출
     */
    @PostMapping("/generate-description")
    public ResponseEntity<AiDescriptionResponse> generateDescription(
            @RequestBody AiDescriptionRequest request) {

        log.info("AI 상품 설명 생성 요청: productName={}, keywords={}",
                request.getProductName(), request.getKeywords());

        try {
            String url = ragApiUrl + "/generate-description";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<AiDescriptionRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<AiDescriptionResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    AiDescriptionResponse.class
            );

            log.info("AI 상품 설명 생성 성공");
            return ResponseEntity.ok(response.getBody());

        } catch (RestClientException e) {
            log.error("AI 서비스 호출 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AiDescriptionResponse(
                            "AI 서비스 호출 실패: " + e.getMessage()
                    ));
        }
    }
}