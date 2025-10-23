//package com.my.backend.websocket;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.my.backend.dto.BidDto;
//import com.my.backend.service.BidService;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.stereotype.Component;
//import org.springframework.web.socket.*;
//import org.springframework.web.socket.handler.TextWebSocketHandler;
//
//import java.util.Collections;
//import java.util.HashSet;
//import java.util.List;
//import java.util.Map;
//import java.util.Set;
//
//@Slf4j
//@Component
//@RequiredArgsConstructor
//public class AuctionWebSocketHandler extends TextWebSocketHandler {
//
//    private final Set<WebSocketSession> sessions = Collections.synchronizedSet(new HashSet<>());
//
//    private final ObjectMapper objectMapper = new ObjectMapper();
//
//    private final BidService bidService;
//
//    @Override
//    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
//        sessions.add(session);
//        log.info("🔌 WebSocket 연결됨: {}", session.getId());
//        session.sendMessage(new TextMessage("서버: WebSocket 연결 성공"));
//    }
//
//    @Override
//    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
//        String payload = message.getPayload();
//        log.info("📨 받은 메시지 ({}): {}", session.getId(), payload);
//
//        try {
//            BidMessage bidMessage = objectMapper.readValue(payload, BidMessage.class);
//
//            // placeBid 메서드 호출, ResponseEntity 받음
//            var responseEntity = bidService.placeBid(
//                    bidMessage.getUserId(),
//                    bidMessage.getProductId(),
//                    bidMessage.getBidPrice()
//            );
//
//            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.hasBody()) {
//                // 입찰 성공 시 입찰 내역 최신화 및 브로드캐스트
//                List<BidDto> bidList = bidService.getBidHistoryList(bidMessage.getProductId());
//
//                Map<String, Object> response = Map.of(
//                        "type", "bidUpdate",
//                        "productId", bidMessage.getProductId(),
//                        "bids", bidList
//                );
//
//                String broadcastMsg = objectMapper.writeValueAsString(response);
//                broadcastMessage(broadcastMsg);
//
//            } else {
//                // 입찰 실패 메시지 클라이언트에 전송
//                String errorMsg = responseEntity.getBody() instanceof Map<?, ?> bodyMap && bodyMap.containsKey("error")
//                        ? bodyMap.get("error").toString()
//                        : "입찰 실패: 입찰 금액이 너무 낮습니다.";
//
//                session.sendMessage(new TextMessage(errorMsg));
//            }
//
//        } catch (Exception e) {
//            log.error("입찰 메시지 처리 오류", e);
//            session.sendMessage(new TextMessage("입찰 메시지 형식 오류"));
//        }
//    }
//
//    @Override
//    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
//        sessions.remove(session);
//        log.info("❌ WebSocket 연결 종료됨: {} (이유: {})", session.getId(), status);
//    }
//
//    @Override
//    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
//        log.error("⚠️ WebSocket 에러 발생 ({}): {}", session.getId(), exception.getMessage());
//    }
//
//    private void broadcastMessage(String message) {
//        synchronized (sessions) {
//            for (WebSocketSession sess : sessions) {
//                try {
//                    if (sess.isOpen()) {
//                        sess.sendMessage(new TextMessage(message));
//                    }
//                } catch (Exception e) {
//                    log.error("메시지 전송 실패 ({}): {}", sess.getId(), e.getMessage());
//                }
//            }
//        }
//    }
//}
