package com.my.backend.controller;

import com.my.backend.service.SearchLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchLogService searchLogService;

    @PostMapping("/log")
    public ResponseEntity<Void> saveSearchLog(@RequestBody Map<String, String> request) {
        String keyword = request.get("keyword");
        if (keyword != null && !keyword.trim().isEmpty()) {
            searchLogService.saveSearchLog(keyword);
        }
        return ResponseEntity.ok().build();
    }
//    전체 흐름:
//
//사용자가 검색 → saveSearchLog(keyword) 호출
//프론트에서 /api/search/log로 POST 요청
//백엔드 SearchController에서 받아서 SearchLogService.saveSearchLog() 호출
//DB search_log 테이블에 저장
//RealTimeSearchWebSocketHandler.broadcastRanking() 호출
//최근 10분간의 검색 로그를 조회하여 순위 계산
//WebSocket으로 모든 연결된 클라이언트에게 실시간 순위 전송
//프론트의 useRealTimeSearch 훅에서 받아서 rankings 상태 업데이트
//화면에 실시간 검색어 표시!
}