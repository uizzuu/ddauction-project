package com.my.backend.business;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
public class NtsApiClient {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String URL = "https://api.odcloud.kr/api/nts-businessman/v1/status";

    // 생성자 주입으로 apiKey 넣기
    public NtsApiClient(@Value("${nts.api.key}") String apiKey) {
        this.restTemplate = new RestTemplate();
        this.apiKey = apiKey;
    }

    public boolean verify(String businessNumber) {
        Map<String, Object> requestBody = Map.of(
                "b_no", List.of(businessNumber)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                URL + "?serviceKey=" + apiKey,
                HttpMethod.POST,
                entity,
                Map.class
        );

        List<Map<String, Object>> data = (List<Map<String, Object>>) response.getBody().get("data");
        String statusCode = (String) data.get(0).get("b_stt_cd");
        return "01".equals(statusCode);
    }
}
