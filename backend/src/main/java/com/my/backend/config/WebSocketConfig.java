package com.my.backend.config;


import com.my.backend.websocket.AuctionWebSocketHandler;
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
    private final WebSocketHandler chatWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(auctionWebSocketHandler, "/ws/auction")
                .setAllowedOrigins("*");

        // 채팅용
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
                            System.err.println("세션에 userId 없음, 연결 거부");
                            return false;
                        }
                        return true;
                    }

                    @Override
                    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                               org.springframework.web.socket.WebSocketHandler wsHandler, Exception exception) {
                    }
                });
}
}