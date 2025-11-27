package com.my.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.my.backend.dto.PrivateChatDto;
import com.my.backend.dto.PublicChatDto;
import com.my.backend.service.ChatService;
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

    private final ChatService chatService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        Map<String, Object> map = objectMapper.readValue(message.getPayload(), Map.class);
        String type = (String) map.get("type"); // "private" or "public"
        Long userId = Long.valueOf(map.get("userId").toString());
        String content = (String) map.get("content");

        if ("private".equals(type)) {
            PrivateChatDto dto = PrivateChatDto.builder().content(content).build();
            PrivateChatDto saved = chatService.savePrivateChat(userId, dto);
            broadcast(objectMapper.writeValueAsString(saved));
        } else if ("public".equals(type)) {
            PublicChatDto dto = PublicChatDto.builder().content(content).build();
            PublicChatDto saved = chatService.savePublicChat(userId, dto);
            broadcast(objectMapper.writeValueAsString(saved));
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
    }
}