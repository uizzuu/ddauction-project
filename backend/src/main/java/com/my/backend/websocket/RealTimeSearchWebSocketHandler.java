package com.my.backend.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.my.backend.service.RealTimeSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class RealTimeSearchWebSocketHandler extends TextWebSocketHandler {

    private final RealTimeSearchService realTimeSearchService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 모든 연결된 세션 관리
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        log.info("실시간 검색어 WebSocket 연결: {}", session.getId());

        // 연결 시 현재 순위 즉시 전송
        sendRanking(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        log.info("실시간 검색어 WebSocket 연결 종료: {}", session.getId());
    }

    // 모든 클라이언트에게 순위 브로드캐스트
    public void broadcastRanking() {
        try {
            List<Map<String, Object>> topKeywords = realTimeSearchService.getTopKeywords(10);

            Map<String, Object> response = new HashMap<>();
            response.put("type", "RANKING");
            response.put("data", topKeywords);
            response.put("timestamp", System.currentTimeMillis());

            String json = objectMapper.writeValueAsString(response);

            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            }

            log.info("실시간 검색어 순위 브로드캐스트 완료: {} 세션", sessions.size());

        } catch (IOException e) {
            log.error("실시간 검색어 브로드캐스트 실패", e);
        }
    }

    // 특정 세션에만 전송 (초기 연결 시)
    private void sendRanking(WebSocketSession session) {
        try {
            List<Map<String, Object>> topKeywords = realTimeSearchService.getTopKeywords(10);

            Map<String, Object> response = new HashMap<>();
            response.put("type", "RANKING");
            response.put("data", topKeywords);
            response.put("timestamp", System.currentTimeMillis());

            String json = objectMapper.writeValueAsString(response);

            if (session.isOpen()) {
                session.sendMessage(new TextMessage(json));
            }

        } catch (IOException e) {
            log.error("실시간 검색어 전송 실패", e);
        }
    }
}