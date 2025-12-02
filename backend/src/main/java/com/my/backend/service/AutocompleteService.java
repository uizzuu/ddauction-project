package com.my.backend.service;

import com.my.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AutocompleteService {

    private final ProductRepository productRepository;

    /**
     * 입력된 키워드로 시작하는 연관 검색어 추천
     *
     * @param keyword 사용자 입력 키워드 (예: "니", "블랙")
     * @param limit 반환할 최대 개수 (기본값: 10)
     * @return 연관 검색어 리스트
     *
     * 동작 예시:
     * keyword = "니" 입력
     * → DB에서 title이 "니트", "니트 원피스", "니트 가디건" 등 찾음
     * → ["니트", "니트 원피스", "니트 가디건"] 반환
     */
    public List<String> getSuggestions(String keyword, int limit) {
        // 입력값 검증
        if (keyword == null || keyword.trim().isEmpty()) {
            log.warn("⚠️ 빈 키워드로 자동완성 요청");
            return List.of();
        }

        // 공백 제거 및 소문자 변환
        String normalizedKeyword = keyword.trim();

        log.info("🔍 연관 검색어 요청: '{}' (최대 {}개)", normalizedKeyword, limit);

        // 페이징 객체 생성 (limit만큼만 가져오기)
        Pageable pageable = PageRequest.of(0, limit);

        // DB에서 제목과 태그 검색
        List<String> suggestions = productRepository
                .findSuggestionsForAutocomplete(normalizedKeyword, pageable);

        // 중복 제거 및 최종 정리
        List<String> result = suggestions.stream()
                .distinct() // 혹시 모를 중복 제거
                .limit(limit) // 최대 개수 제한
                .collect(Collectors.toList());

        log.info("✅ 연관 검색어 {}개 반환: {}", result.size(), result);

        return result;
    }

    /**
     * 인기 검색어 반환 (키워드 입력 전)
     *
     * 사용자가 검색창을 클릭했을 때 (아무것도 입력 안 했을 때)
     * 조회수 높은 상품들의 제목을 "인기 검색어"로 보여줌
     *
     * @param limit 반환할 개수 (기본값: 10)
     * @return 인기 검색어 리스트
     */
    public List<String> getPopularKeywords(int limit) {
        log.info("📊 인기 검색어 요청 (최대 {}개)", limit);

        Pageable pageable = PageRequest.of(0, limit);

        List<String> popularKeywords = productRepository
                .findTopKeywordsByViewCount(pageable);

        log.info("✅ 인기 검색어 {}개 반환", popularKeywords.size());

        return popularKeywords;
    }
}