package com.my.backend.config;

import com.my.backend.websocket.AuctionWebSocketHandler;
// import com.my.backend.config.WebSocketHandler; // 개인채팅용
import com.my.backend.websocket.PublicChatWebSocketHandler;
import com.my.backend.websocket.NotificationWebSocketHandler;
import com.my.backend.websocket.RealTimeSearchWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final AuctionWebSocketHandler auctionWebSocketHandler;
    private final WebSocketHandler chatWebSocketHandler; // 개인채팅용
    private final PublicChatWebSocketHandler publicChatWebSocketHandler; // 공개채팅용
    private final RealTimeSearchWebSocketHandler realTimeSearchWebSocketHandler;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {

        // 경매용 WebSocket
        registry.addHandler(auctionWebSocketHandler, "/ws/auction")
                .setAllowedOrigins("*");

        // 공개채팅용 WebSocket
        registry.addHandler(publicChatWebSocketHandler, "/ws/public-chat")
                .setAllowedOrigins("*")
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(ServerHttpRequest request,
                                                   ServerHttpResponse response,
                                                   org.springframework.web.socket.WebSocketHandler wsHandler,
                                                   Map<String, Object> attributes) throws Exception {
                        String query = request.getURI().getQuery(); // 예: "userId=1"
                        if (query != null) {
                            Arrays.stream(query.split("&"))
                                    .map(s -> s.split("="))
                                    .filter(arr -> arr.length == 2)
                                    .forEach(arr -> {
                                        if ("userId".equals(arr[0])) {
                                            attributes.put("userId", Long.valueOf(arr[1]));
                                            System.out.println("[공개채팅] userId 세션에 추가: " + arr[1]);
                                        }
                                    });
                        } else {
                            System.err.println("[공개채팅] userId 누락, 연결 거부");
                            return false;
                        }
                        return true;
                    }

                    @Override
                    public void afterHandshake(ServerHttpRequest request,
                                               ServerHttpResponse response,
                                               org.springframework.web.socket.WebSocketHandler wsHandler,
                                               Exception exception) {
                        // 필요시 로그 남기기 가능
                    }
                });

        // 실시간 검색어용 WebSocket
        registry.addHandler(realTimeSearchWebSocketHandler, "/ws/realtime-search")
                .setAllowedOrigins("*");

        registry.addHandler(notificationWebSocketHandler, "/ws/notifications")
                .setAllowedOrigins("*")
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(ServerHttpRequest request,
                                                   ServerHttpResponse response,
                                                   org.springframework.web.socket.WebSocketHandler wsHandler,
                                                   Map<String, Object> attributes) throws Exception {
                        String query = request.getURI().getQuery(); // "userId=123"
                        if (query != null && query.contains("userId=")) {
                            String userIdStr = query.split("userId=")[1].split("&")[0];
                            attributes.put("userId", Long.valueOf(userIdStr));
                            System.out.println("[알림] userId 세션에 추가: " + userIdStr);
                            return true;
                        } else {
                            System.err.println("[알림] userId 누락, 연결 거부");
                            return false;
                        }
                    }

                    @Override
                    public void afterHandshake(ServerHttpRequest request,
                                               ServerHttpResponse response,
                                               org.springframework.web.socket.WebSocketHandler wsHandler,
                                               Exception exception) {
                    }
                });

        // 개인채팅용 WebSocket (현재는 테스트용으로 주석)

        registry.addHandler(chatWebSocketHandler, "/ws/chat")
                .setAllowedOrigins("*")
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(ServerHttpRequest request,
                                                   ServerHttpResponse response,
                                                   org.springframework.web.socket.WebSocketHandler wsHandler,
                                                   Map<String, Object> attributes) throws Exception {
                        String query = request.getURI().getQuery(); // "userId=2&targetUserId=1"
                        if (query != null) {
                            Map<String, String> params = Arrays.stream(query.split("&"))
                                    .map(s -> s.split("="))
                                    .filter(arr -> arr.length == 2)
                                    .collect(Collectors.toMap(arr -> arr[0], arr -> arr[1]));

                            if (params.containsKey("userId")) {
                                attributes.put("userId", Long.valueOf(params.get("userId")));
                            }
                            if (params.containsKey("targetUserId")) {
                                attributes.put("targetUserId", Long.valueOf(params.get("targetUserId")));
                            }
                        } else {
                            System.err.println("개인채팅 세션에 userId 없음, 연결 거부");
                            return false;
                        }
                        return true;
                    }

                    @Override
                    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                               org.springframework.web.socket.WebSocketHandler wsHandler, Exception exception) {}
                });

    }
}
