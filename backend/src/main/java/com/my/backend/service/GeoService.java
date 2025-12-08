package com.my.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeoService {

    @Value("${spring.security.oauth2.client.registration.kakao.client-id}")
    private String kakaoApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getAddressFromCoords(double latitude, double longitude) {
        if (kakaoApiKey == null || kakaoApiKey.trim().isEmpty()) {
            log.error("Kakao API Key is missing");
            return "서버 설정 오류: 카카오 키 없음";
        }

        try {
            String url = String.format("https://dapi.kakao.com/v2/local/geo/coord2address.json?x=%f&y=%f", longitude, latitude);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + kakaoApiKey);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            log.info("Kakao GeoAPI Response: {}", response.getBody());

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode documents = root.path("documents");
                if (documents.isArray() && documents.size() > 0) {
                    JsonNode addressNode = documents.get(0).path("address");
                    if (!addressNode.isMissingNode()) {
                        return addressNode.path("address_name").asText();
                    }
                    JsonNode roadAddressNode = documents.get(0).path("road_address");
                    if (!roadAddressNode.isMissingNode()) {
                        return roadAddressNode.path("address_name").asText();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to reverse geocode: {}", e.getMessage());
            return "주소 변환 실패: " + e.getMessage();
        }
        
        return "주소를 찾을 수 없음";
    }
}
