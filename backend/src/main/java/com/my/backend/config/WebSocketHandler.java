package com.my.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.my.backend.dto.ChatRoomDto;
import com.my.backend.dto.PrivateChatDto;
import com.my.backend.service.ChattingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class WebSocketHandler extends TextWebSocketHandler {

    private final ChattingService chatService;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    // 세션 관리: userId -> 여러 WebSocketSession
    private final Map<Long, List<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Object userIdAttr = session.getAttributes().get("userId");
        if (userIdAttr == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        Long userId;
        try {
            userId = Long.valueOf(userIdAttr.toString());
        } catch (Exception e) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        // targetUserId 선택 사항
        Object targetIdAttr = session.getAttributes().get("targetUserId");
        Long targetUserId = null;
        if (targetIdAttr != null) {
            try {
                targetUserId = Long.valueOf(targetIdAttr.toString());
            } catch (Exception ignored) {}
        }

        userSessions.computeIfAbsent(userId, k -> new ArrayList<>()).add(session);
        session.getAttributes().put("targetUserId", targetUserId);

        System.out.println("[PrivateChat] 연결: userId=" + userId + ", targetUserId=" + targetUserId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        Map<String, Object> map = objectMapper.readValue(message.getPayload(), Map.class);
        String type = (String) map.get("type");
        if (!"PRIVATE".equalsIgnoreCase(type)) return; // 개인채팅만 처리

        Long userId = map.get("userId") != null ? Long.valueOf(map.get("userId").toString()) : null;
        Long targetUserId = map.get("targetUserId") != null ? Long.valueOf(map.get("targetUserId").toString()) : null;
        Long productId = map.get("productId") != null ? Long.valueOf(map.get("productId").toString()) : null;
        String content = (String) map.get("content");

        if (userId == null || targetUserId == null || productId == null || content == null || content.trim().isEmpty()) {
            return;
        }

        // 채팅방 조회 또는 생성
        ChatRoomDto chatRoomDto = chatService.getOrCreateChatRoom(userId, targetUserId, productId);

        // PrivateChat DTO 생성 및 DB 저장
        PrivateChatDto savedChat = chatService.savePrivateChat(userId, targetUserId, productId,
                PrivateChatDto.builder()
                        .chatRoomId(chatRoomDto.getChatRoomId())
                        .content(content)
                        .build()
        );

        Map<String, Object> jsonMap = new HashMap<>();
        jsonMap.put("type", "PRIVATE");
        jsonMap.put("chatRoomId", chatRoomDto.getChatRoomId());
        jsonMap.put("userId", savedChat.getUserId());
        jsonMap.put("targetUserId", targetUserId);
        jsonMap.put("content", savedChat.getContent());
        jsonMap.put("nickName", savedChat.getNickName());

        String json = objectMapper.writeValueAsString(jsonMap);

        sendToUser(userId, json);
        sendToUser(targetUserId, json);
    }

    private void sendToUser(Long userId, String message) throws IOException {
        List<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions != null) {
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) session.sendMessage(new TextMessage(message));
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        userSessions.values().forEach(list -> list.remove(session));
        userSessions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        System.out.println("[PrivateChat] 연결 종료: " + session.getId());
    }
}
