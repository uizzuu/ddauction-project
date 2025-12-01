package com.my.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.my.backend.dto.PrivateChatDto;
import com.my.backend.dto.PublicChatDto;
import com.my.backend.service.ChattingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class WebSocketHandler extends TextWebSocketHandler {

    private final ChattingService chatService;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    // 세션 관리: 유저ID -> WebSocketSession
    private final Map<Long, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Object userIdAttr = session.getAttributes().get("userId");
        if (userIdAttr == null) {
            System.err.println("세션에 userId 없음, 연결 종료: " + session.getId());
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        Long userId = Long.valueOf(userIdAttr.toString());
        userSessions.put(userId, session);
        System.out.println("WebSocket 연결됨: " + session.getId() + " / userId: " + userId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        System.out.println("서버 수신 메시지: " + message.getPayload());

        Map<String, Object> map = objectMapper.readValue(message.getPayload(), Map.class);
        String type = (String) map.get("type");
        Long userId = map.get("userId") != null ? Long.valueOf(map.get("userId").toString()) : null;
        if (userId == null) {
            System.err.println("userId 누락, 메시지 무시");
            return;
        }
        String content = (String) map.get("content");

        if ("PRIVATE".equalsIgnoreCase(type)) {
            Long targetUserId = map.get("targetUserId") != null ? Long.valueOf(map.get("targetUserId").toString()) : null;
            if (targetUserId == null) {
                System.err.println("개인 채팅 대상이 지정되지 않음.");
                return;
            }

            // DB 저장
            PrivateChatDto dto = PrivateChatDto.builder().content(content).build();
            PrivateChatDto saved = chatService.savePrivateChat(userId, dto);

            // JSON에 targetUserId 포함
            Map<String, Object> jsonMap = new HashMap<>();
            jsonMap.put("type", "PRIVATE");
            jsonMap.put("userId", saved.getUserId());
            jsonMap.put("targetUserId", targetUserId);
            jsonMap.put("content", saved.getContent());
            jsonMap.put("nickName", saved.getNickName());

            String json = objectMapper.writeValueAsString(jsonMap);
            System.out.println("개인 채팅 전송: " + json);

            // 개인 채팅 대상과 발신자에게만 전송
            sendToUser(targetUserId, json);
            sendToUser(userId, json);

        } else if ("PUBLIC".equalsIgnoreCase(type)) {
            // 공개 채팅 DB 저장
            PublicChatDto dto = PublicChatDto.builder().content(content).build();
            PublicChatDto saved = chatService.savePublicChat(userId, dto);

            // JSON 직렬화
            Map<String, Object> jsonMap = new HashMap<>();
            jsonMap.put("type", "PUBLIC");
            jsonMap.put("userId", saved.getUserId());
            jsonMap.put("content", saved.getContent());
            jsonMap.put("nickName", saved.getNickName());

            String json = objectMapper.writeValueAsString(jsonMap);
            System.out.println("공개 채팅 브로드캐스트: " + json);

            broadcastToAll(json);
        }
    }

    private void broadcastToAll(String message) throws IOException {
        for (WebSocketSession session : userSessions.values()) {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(message));
            }
        }
    }

    private void sendToUser(Long userId, String message) throws IOException {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            session.sendMessage(new TextMessage(message));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        userSessions.entrySet().removeIf(entry -> entry.getValue().equals(session));
        System.out.println("WebSocket 연결 종료: " + session.getId());
    }

}
