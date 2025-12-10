package com.my.backend.websocket;

import com.my.backend.dto.NotificationDto;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = Collections.synchronizedSet(new HashSet<>());

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = (Long) session.getAttributes().get("userId");
        System.out.println("✅ [알림] 새 클라이언트 연결: sessionId=" + session.getId() + ", userId=" + userId);
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        System.out.println("❌ [알림] 클라이언트 연결 종료: " + session.getId());
    }

    // 전체 브로드캐스트용
    public void sendNotification(NotificationDto noti) {
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
    public void sendNotificationToUser(Long userId, NotificationDto noti) {
        System.out.println("📢 [알림] 전송 시도: userId=" + userId + ", 내용=" + noti.getContent());

        TextMessage msg = new TextMessage(noti.toJson());
        synchronized (sessions) {
            int sentCount = 0;
            for (WebSocketSession session : sessions) {
                try {
                    Long sessionUserId = (Long) session.getAttributes().get("userId");
                    System.out.println("  - 세션 체크: sessionId=" + session.getId() + ", userId=" + sessionUserId);

                    if (session.isOpen() && sessionUserId != null && sessionUserId.equals(userId)) {
                        session.sendMessage(msg);
                        sentCount++;
                        System.out.println("  ✅ 알림 전송 성공!");
                    }
                } catch (Exception e) {
                    System.err.println("  ❌ 알림 전송 실패: " + e.getMessage());
                    e.printStackTrace();
                }
            }
            System.out.println("📊 총 " + sentCount + "개 세션에 알림 전송됨");
        }
    }
}