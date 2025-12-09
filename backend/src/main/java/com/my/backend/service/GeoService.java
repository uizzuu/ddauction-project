package com.my.backend.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

/**
 * Geocoding 서비스 (좌표 → 주소 변환)
 * OpenStreetMap Nominatim API 사용 (무료, 인증 불필요)
 */
@Service
@RequiredArgsConstructor
public class GeoService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 좌표를 주소로 변환 (Reverse Geocoding)
     * @param latitude 위도
     * @param longitude 경도
     * @return 주소 문자열
     */
    public String reverseGeocode(double latitude, double longitude) {
        try {
            // Nominatim API URL (한국어 응답)
            String url = String.format(
                "https://nominatim.openstreetmap.org/reverse?format=json&lat=%f&lon=%f&zoom=18&addressdetails=1&accept-language=ko",
                latitude, longitude
            );

            // User-Agent 헤더 필수 (Nominatim 정책)
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "DdangDdangAuction/1.0");

            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode address = root.path("address");
                
                // 한국 주소 구성 요소 추출
                String province = address.path("province").asText("");  // 서울특별시, 경기도
                String city = address.path("city").asText("");  // 서울시, 수원시
                String county = address.path("county").asText("");  // 구
                String suburb = address.path("suburb").asText("");  // 동/읍/면
                String neighbourhood = address.path("neighbourhood").asText("");  // 세부 동
                String road = address.path("road").asText("");  // 도로명
                String houseNumber = address.path("house_number").asText("");  // 번지
                
                // 한국 주소 형식: 대한민국 서울특별시 강남구 역삼동 테헤란로 123
                StringBuilder sb = new StringBuilder();
                
                // 1. 국가 (optional, 보통 생략)
                // if (!country.isEmpty()) sb.append(country).append(" ");
                
                // 2. 시/도
                if (!province.isEmpty()) {
                    sb.append(province).append(" ");
                } else if (!city.isEmpty()) {
                    sb.append(city).append(" ");
                }
                
                // 3. 구/군
                if (!county.isEmpty()) {
                    sb.append(county).append(" ");
                }
                
                // 4. 동/읍/면
                if (!neighbourhood.isEmpty()) {
                    sb.append(neighbourhood).append(" ");
                } else if (!suburb.isEmpty()) {
                    sb.append(suburb).append(" ");
                }
                
                // 5. 도로명
                if (!road.isEmpty()) {
                    sb.append(road);
                    // 6. 번지
                    if (!houseNumber.isEmpty()) {
                        sb.append(" ").append(houseNumber);
                    }
                }
                
                String result = sb.toString().trim();
                return result.isEmpty() ? "주소 변환 실패" : result;
            }
            
            return "주소를 찾을 수 없습니다";
            
        } catch (Exception e) {
            System.err.println("Geocoding 오류: " + e.getMessage());
            return "주소 변환 중 오류 발생: " + e.getMessage();
        }
    }
}
