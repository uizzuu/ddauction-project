package com.my.backend.service;

import com.my.backend.repository.SearchLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RealTimeSearchService {

    private final SearchLogRepository searchLogRepository;

    public List<Map<String, Object>> getTopKeywords(int limit) {
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
        List<String> recentKeywords = searchLogRepository.findRecentKeywords(tenMinutesAgo);

        // 키워드별 카운트
        Map<String, Long> keywordCount = recentKeywords.stream()
                .collect(Collectors.groupingBy(k -> k, Collectors.counting()));

        // 상위 N개 추출 및 순위 부여
        return keywordCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("keyword", entry.getKey());
                    map.put("count", entry.getValue());
                    return map;
                })
                .collect(Collectors.toList());
    }
}