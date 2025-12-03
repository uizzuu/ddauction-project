package com.my.backend.service;

import com.my.backend.repository.SearchLogRepository;
import com.my.backend.entity.SearchLog;
import com.my.backend.websocket.RealTimeSearchWebSocketHandler;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SearchLogService {

    private final SearchLogRepository searchLogRepository;
    private final RealTimeSearchWebSocketHandler realTimeSearchWebSocketHandler;

    @Transactional
    public void saveSearchLog(String keyword) {
        SearchLog log = SearchLog.builder()
                .keyword(keyword)
                .searchedAt(LocalDateTime.now())
                .build();
        searchLogRepository.save(log);

        // 검색 로그 저장 후 실시간 순위 브로드캐스트
        realTimeSearchWebSocketHandler.broadcastRanking();
    }
}