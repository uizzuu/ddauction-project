package com.my.backend.business;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component                     // ← 스프링에서 자동 빈 등록
@RequiredArgsConstructor
public class NtsApiClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${nts.api.key}")   // ← application.yml 에서 불러올 API Key
    private String apiKey;

    private final String URL = "https://api.odcloud.kr/api/nts-businessman/v1/status";

    public boolean verify(String businessNumber) {

        // body JSON 생성
        Map<String, Object> requestBody = Map.of(
                "b_no", List.of(businessNumber)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(requestBody, headers);

        // API 호출
        ResponseEntity<Map> response =
                restTemplate.exchange(
                        URL + "?serviceKey=" + apiKey,
                        HttpMethod.POST,
                        entity,
                        Map.class
                );

        // "data" 배열 파싱
        List<Map<String, Object>> data =
                (List<Map<String, Object>>) response.getBody().get("data");

        String statusCode = (String) data.get(0).get("b_stt_cd");
        // 01 = 정상, 그 외 폐업/휴업 등

        return "01".equals(statusCode);   // 정상 사업자이면 true
    }
}
