package com.my.backend.controller;

import com.my.backend.service.AutocompleteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/autocomplete")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // 실제 배포 시 프론트엔드 도메인으로 변경
public class AutocompleteController {

    private final AutocompleteService autocompleteService;

    /**
     * 연관 검색어 자동완성 API
     *
     * 사용 예시:
     * GET /api/autocomplete?keyword=니트&limit=10
     *
     * 응답 예시:
     * {
     *   "success": true,
     *   "keyword": "니트",
     *   "suggestions": ["니트", "니트 원피스", "니트 가디건"]
     * }
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAutocompleteSuggestions(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "10") int limit
    ) {
        log.info("📨 자동완성 API 호출: keyword='{}', limit={}", keyword, limit);

        try {
            List<String> suggestions;

            // 키워드가 비어있으면 인기 검색어 반환
            if (keyword.trim().isEmpty()) {
                log.info("💡 키워드 없음 → 인기 검색어 반환");
                suggestions = autocompleteService.getPopularKeywords(limit);
            } else {
                // 연관 검색어 반환
                suggestions = autocompleteService.getSuggestions(keyword, limit);
            }

            // 응답 생성
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("keyword", keyword);
            response.put("suggestions", suggestions);
            response.put("count", suggestions.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 자동완성 처리 중 오류 발생: ", e);

            // 오류 발생 시에도 빈 배열 반환 (프론트엔드가 정상 작동하도록)
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("keyword", keyword);
            errorResponse.put("message", "자동완성 처리 중 오류가 발생했습니다: " + e.getMessage());
            errorResponse.put("suggestions", List.of());
            errorResponse.put("count", 0);

            // 500 에러 대신 200으로 반환 (프론트엔드가 에러 처리 안 해도 됨)
            return ResponseEntity.ok(errorResponse);
        }
    }

    /**
     * 인기 검색어 조회 API
     *
     * 사용 예시:
     * GET /api/autocomplete/popular?limit=10
     *
     * 응답 예시:
     * {
     *   "success": true,
     *   "keywords": ["베이직 티셔츠", "청바지", "운동화"]
     * }
     */
    @GetMapping("/popular")
    public ResponseEntity<Map<String, Object>> getPopularKeywords(
            @RequestParam(required = false, defaultValue = "10") int limit
    ) {
        log.info("📨 인기 검색어 API 호출: limit={}", limit);

        try {
            List<String> popularKeywords = autocompleteService.getPopularKeywords(limit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("keywords", popularKeywords);
            response.put("count", popularKeywords.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ 인기 검색어 조회 중 오류 발생: ", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "인기 검색어 조회 중 오류가 발생했습니다: " + e.getMessage());
            errorResponse.put("keywords", List.of());
            errorResponse.put("count", 0);

            return ResponseEntity.ok(errorResponse);
        }
    }
}