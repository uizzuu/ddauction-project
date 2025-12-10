package com.my.backend.websocket;

import com.my.backend.dto.NotificationMessage;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    // 연결된 클라이언트 세션 저장
    private final Set<WebSocketSession> sessions = Collections.synchronizedSet(new HashSet<>());

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 프론트에서 userId 쿼리 파라미터로 전달했다고 가정
        String query = session.getUri().getQuery(); // 예: userId=1
        if (query != null && query.startsWith("userId=")) {
            String userIdStr = query.split("=")[1];
            session.getAttributes().put("userId", Long.valueOf(userIdStr));
            System.out.println("새 클라이언트 연결: " + session.getId() + ", userId=" + userIdStr);
        }

        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        System.out.println("클라이언트 연결 종료: " + session.getId());
    }

    // 전체 브로드캐스트용
    public void sendNotification(NotificationMessage noti) {
        TextMessage msg = new TextMessage(noti.toJson());
        synchronized (sessions) {
            for (WebSocketSession session : sessions) {
                try {
                    if (session.isOpen()) {
                        session.sendMessage(msg);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    // 특정 사용자에게만 보내기
    public void sendNotificationToUser(Long userId, NotificationMessage noti) {
        TextMessage msg = new TextMessage(noti.toJson());
        synchronized (sessions) {
            for (WebSocketSession session : sessions) {
                try {
                    Long sessionUserId = (Long) session.getAttributes().get("userId");
                    if (session.isOpen() && sessionUserId != null && sessionUserId.equals(userId)) {
                        session.sendMessage(msg);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
