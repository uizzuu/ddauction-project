package com.my.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.my.backend.dto.ChatRoomDto;
import com.my.backend.dto.PrivateChatDto;
import com.my.backend.dto.PublicChatDto;
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

    // 세션 관리: 유저ID -> 여러 WebSocketSession
    private final Map<Long, List<WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Object userIdAttr = session.getAttributes().get("userId");
        if (userIdAttr == null) {
            System.err.println("세션에 userId 없음, 연결 종료: " + session.getId());
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        Long userId = Long.valueOf(userIdAttr.toString());
        userSessions.computeIfAbsent(userId, k -> new ArrayList<>()).add(session);
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
        if (content == null || content.trim().isEmpty()) {
            System.err.println("내용이 비어있음, 메시지 무시");
            return;
        }

        try {
            if ("PRIVATE".equalsIgnoreCase(type)) {
                Long targetUserId = map.get("targetUserId") != null ? Long.valueOf(map.get("targetUserId").toString()) : null;
                Long productId = map.get("productId") != null ? Long.valueOf(map.get("productId").toString()) : null;

                if (targetUserId == null || productId == null) {
                    System.err.println("개인 채팅 대상 또는 productId 누락.");
                    return;
                }

                // 채팅방 조회 또는 생성
                ChatRoomDto chatRoomDto = chatService.getOrCreateChatRoom(userId, targetUserId, productId);

                // PrivateChat DTO 생성 및 DB 저장
                PrivateChatDto privateChatDto = PrivateChatDto.builder()
                        .chatRoomId(chatRoomDto.getChatRoomId())
                        .content(content)
                        .build();

                PrivateChatDto savedChat = chatService.savePrivateChat(userId, targetUserId, productId, privateChatDto);

                // JSON 생성
                Map<String, Object> jsonMap = new HashMap<>();
                jsonMap.put("type", "PRIVATE");
                jsonMap.put("chatRoomId", chatRoomDto.getChatRoomId());
                jsonMap.put("userId", savedChat.getUserId());
                jsonMap.put("targetUserId", targetUserId);
                jsonMap.put("content", savedChat.getContent());
                jsonMap.put("nickName", savedChat.getNickName());

                String json = objectMapper.writeValueAsString(jsonMap);
                System.out.println("개인 채팅 전송: " + json);

                // 발신자와 수신자에게만 전송
                sendToUser(targetUserId, json);
                sendToUser(userId, json);

            } else if ("PUBLIC".equalsIgnoreCase(type)) {
                // 공개 채팅 저장 시 DB에 유저가 없으면 무시
                PublicChatDto dto = PublicChatDto.builder().content(content).build();
                PublicChatDto saved;
                try {
                    saved = chatService.savePublicChat(userId, dto);
                } catch (RuntimeException e) {
                    System.err.println("공개 채팅 저장 실패: " + e.getMessage());
                    return;
                }

                Map<String, Object> jsonMap = new HashMap<>();
                jsonMap.put("type", "PUBLIC");
                jsonMap.put("userId", saved.getUserId());
                jsonMap.put("content", saved.getContent());
                jsonMap.put("nickName", saved.getNickName());

                String json = objectMapper.writeValueAsString(jsonMap);
                System.out.println("공개 채팅 브로드캐스트: " + json);

                broadcastToAll(json);
            }
        } catch (Exception e) {
            System.err.println("메시지 처리 중 예외 발생: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void broadcastToAll(String message) throws IOException {
        for (List<WebSocketSession> sessions : userSessions.values()) {
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) session.sendMessage(new TextMessage(message));
            }
        }
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
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        userSessions.values().forEach(list -> list.remove(session));
        userSessions.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        System.out.println("WebSocket 연결 종료: " + session.getId());
    }
}
