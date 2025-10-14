package com.my.backend.service;

import com.my.backend.dto.DocumentDto;
import com.my.backend.dto.KakaoApiResponseDto;
import com.my.backend.entity.Pharmacy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class KakaoMapService {

    private final RestTemplate restTemplate;

    public KakaoMapService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Value("${KAKAO_REST_API_KEY}")
    private String kakaoRestApiKey;

    public List<Pharmacy> searchPharmacies(String location, int limit) {
        if (ObjectUtils.isEmpty(location)) return List.of();

        URI uri = UriComponentsBuilder
                .fromUriString("https://dapi.kakao.com/v2/local/search/category.json")
                .queryParam("category_group_code", "PM9") // 약국 코드
                .queryParam("query", location)
                .queryParam("radius", 1000)
                .build()
                .encode()
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, "KakaoAK " + kakaoRestApiKey);
        HttpEntity<Object> entity = new HttpEntity<>(headers);

        ResponseEntity<KakaoApiResponseDto> response = restTemplate.exchange(
                uri, HttpMethod.GET, entity, KakaoApiResponseDto.class);

        List<DocumentDto> documents = response.getBody().getDocuments();

        return documents.stream().limit(limit).map(d -> new Pharmacy(
                null,
                d.getPlace_name(),
                d.getDistance() != null ? Double.parseDouble(d.getDistance()) : null,
                Double.parseDouble(d.getY()),
                Double.parseDouble(d.getX())
        )).collect(Collectors.toList());
    }
}