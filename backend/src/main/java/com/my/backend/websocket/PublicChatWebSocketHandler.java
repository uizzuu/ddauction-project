package com.my.backend.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.my.backend.dto.PublicChatDto;
import com.my.backend.service.ChattingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;

@Component
@RequiredArgsConstructor
public class PublicChatWebSocketHandler extends TextWebSocketHandler {

    private final ChattingService chatService;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    // 세션 관리: 모든 접속자
    private final List<WebSocketSession> sessions = Collections.synchronizedList(new ArrayList<>());

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Object userIdAttr = session.getAttributes().get("userId");
        System.out.println("[공개채팅] 연결됨, 세션ID=" + session.getId() + ", userId=" + userIdAttr);

        if (userIdAttr == null) {
            System.err.println("[공개채팅] userId 없음, 연결 종료, 세션ID=" + session.getId());
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        sessions.add(session);
        System.out.println("[공개채팅] 현재 접속 세션 수: " + sessions.size());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        System.out.println("[공개채팅] 수신 메시지: " + message.getPayload() + ", 세션ID=" + session.getId());

        Map<String, Object> map = objectMapper.readValue(message.getPayload(), Map.class);
        String content = (String) map.get("content");
        Long userId = null;

        try {
            if (map.get("userId") != null) userId = Long.valueOf(map.get("userId").toString());
        } catch (Exception e) {
            System.err.println("[공개채팅] userId 형식 오류: " + map.get("userId"));
        }

        if (userId == null || content == null || content.trim().isEmpty()) {
            System.err.println("[공개채팅] userId 또는 내용 누락, 메시지 무시, 세션ID=" + session.getId());
            return;
        }

        // 유저 정지 체크 추가
        boolean isBanned = chatService.isUserBanned(userId); // DB에서 active=1인 정지 있는지 조회
        if (isBanned) {
            // 클라이언트에 알림 보내고 메시지 무시
            sendMessageToUser(userId, "채팅 정지 상태라 메시지를 보낼 수 없습니다.");
            return;
        }

        // 공개채팅 저장
        PublicChatDto saved = chatService.savePublicChat(userId, PublicChatDto.builder()
                .content(content)
                .build()
        );

        // 브로드캐스트용 JSON 생성
        Map<String, Object> jsonMap = new HashMap<>();
        jsonMap.put("type", "PUBLIC");
        jsonMap.put("userId", saved.getUserId());
        jsonMap.put("content", saved.getContent());
        jsonMap.put("nickName", saved.getNickName());

        String json = objectMapper.writeValueAsString(jsonMap);

        // 모든 접속자에게 브로드캐스트
        broadcastToAll(json);
    }

    private void broadcastToAll(String message) throws IOException {
        synchronized (sessions) {
            Iterator<WebSocketSession> iter = sessions.iterator();
            while (iter.hasNext()) {
                WebSocketSession s = iter.next();
                if (s.isOpen()) {
                    System.out.println("[공개채팅] 메시지 전송, 세션ID=" + s.getId());
                    s.sendMessage(new TextMessage(message));
                } else {
                    System.out.println("[공개채팅] 닫힌 세션 제거, 세션ID=" + s.getId());
                    iter.remove();
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        System.out.println("[공개채팅] 연결 종료, 세션ID=" + session.getId() + ", 상태: " + status);
        System.out.println("[공개채팅] 현재 접속 세션 수: " + sessions.size());
    }


    public void sendMessageToUser(Long userId, String message) {
        synchronized (sessions) {
            for (WebSocketSession s : sessions) {
                Object sessionUserId = s.getAttributes().get("userId");
                if (sessionUserId != null && userId.equals(Long.valueOf(sessionUserId.toString())) && s.isOpen()) {
                    try {
                        s.sendMessage(new TextMessage(message));
                        System.out.println("[공개채팅] 밴 알림 전송, userId=" + userId);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                    break; // userId는 하나뿐이므로 전송 후 종료
                }
            }
        }
    }
}
