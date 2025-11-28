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
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
@RequiredArgsConstructor
public class WebSocketHandler extends TextWebSocketHandler {

    private final ChattingService chatService;

    // JavaTimeModule 등록 + ISO 날짜 직렬화 활성화
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("WebSocket 연결됨: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        System.out.println("서버 수신 메시지: " + message.getPayload());

        Map<String, Object> map = objectMapper.readValue(message.getPayload(), Map.class);
        String type = (String) map.get("type");
        Long userId = Long.valueOf(map.get("userId").toString());
        String content = (String) map.get("content");

        if ("PRIVATE".equalsIgnoreCase(type)) {
            PrivateChatDto dto = PrivateChatDto.builder().content(content).build();
            PrivateChatDto saved = chatService.savePrivateChat(userId, dto);
            String json = objectMapper.writeValueAsString(saved);
            System.out.println("브로드캐스트 메시지: " + json);
            broadcast(json);
        } else if ("PUBLIC".equalsIgnoreCase(type)) {
            PublicChatDto dto = PublicChatDto.builder().content(content).build();
            PublicChatDto saved = chatService.savePublicChat(userId, dto);
            String json = objectMapper.writeValueAsString(saved);
            System.out.println("브로드캐스트 메시지: " + json);
            broadcast(json);
        }
    }

    private void broadcast(String message) throws IOException {
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(message));
            }
        }
    }
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        System.out.println("WebSocket 연결 종료: " + session.getId());
    }
}
