package com.my.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.my.backend.repository.ProductRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
            return List.of();
        }

        // 공백 제거
        String normalizedKeyword = keyword.trim();

        // 초성 검색 여부 확인
        boolean isChosungSearch = com.my.backend.util.KoreanChosungUtil.isChosungOnly(normalizedKeyword);

        List<String> result;
        
        if (isChosungSearch) {
            // 초성 검색: 모든 상품을 가져와서 초성 매칭 필터링
            Pageable pageable = PageRequest.of(0, 1000); // 충분히 많은 데이터 가져오기
            List<String> allSuggestions = productRepository
                    .findSuggestionsForAutocomplete("", pageable); // 빈 문자열로 모든 상품 가져오기
            
            result = allSuggestions.stream()
                    .filter(title -> com.my.backend.util.KoreanChosungUtil.matchesChosung(title, normalizedKeyword))
                    .distinct()
                    .limit(limit)
                    .collect(Collectors.toList());
        } else {
            // 일반 검색: DB 쿼리로 필터링
            Pageable pageable = PageRequest.of(0, limit);
            List<String> suggestions = productRepository
                    .findSuggestionsForAutocomplete(normalizedKeyword, pageable);
            
            result = suggestions.stream()
                    .distinct()
                    .limit(limit)
                    .collect(Collectors.toList());
        }

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
        Pageable pageable = PageRequest.of(0, limit);

        List<String> popularKeywords = productRepository
                .findTopKeywordsByViewCount(pageable);

        return popularKeywords;
    }
}