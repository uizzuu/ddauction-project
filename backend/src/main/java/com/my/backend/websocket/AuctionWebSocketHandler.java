package com.my.backend.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.my.backend.enums.ProductStatus;
import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import com.my.backend.repository.BidRepository;
import com.my.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuctionWebSocketHandler implements WebSocketHandler {

    private final Map<Long, Set<WebSocketSession>> productSessions = new ConcurrentHashMap<>();
    private final Map<Long, List<Bid>> bidHistoryMap = new ConcurrentHashMap<>();

    private final BidRepository bidRepository;
    private final ProductRepository productRepository;

    public void initAuctionWebSocketHandler() {
        List<Product> activeProducts = productRepository.findByProductStatus(ProductStatus.ACTIVE);
        for (Product product : activeProducts) {
            List<Bid> bidHistory = bidRepository.findByProductOrderByCreatedAtDesc(product);
            bidHistoryMap.put(product.getProductId(), bidHistory);
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long productId = parseProductId(session);
        if (productId == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            log.warn("상품을 찾을 수 없음 - 연결 종료: {}", session.getId());
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        productSessions.computeIfAbsent(productId, k -> ConcurrentHashMap.newKeySet()).add(session);

        List<Bid> bidHistory = bidHistoryMap.computeIfAbsent(productId,
                pid -> bidRepository.findByProductOrderByCreatedAtDesc(product));

        sendBidHistory(session, bidHistory);

        log.info("새 세션 연결: {}, productId={}", session.getId(), productId);
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {
        try {
            Long productId = parseProductId(session);
            if (productId == null) {
                log.warn("productId 없음, 무시");
                return;
            }

            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) return;

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> msg = mapper.readValue(message.getPayload().toString(), Map.class);

            Long bidPrice = ((Number) msg.get("bidPrice")).longValue();
            Long userId = ((Number) msg.get("userId")).longValue(); // 필요 시 인증된 사용자 정보

            // 안전하게 Bid 생성
            Bid bid = Bid.builder()
                    .product(product)
                    .bidPrice(bidPrice)
                    .createdAt(LocalDateTime.now())
                    .build();

            bidRepository.save(bid);

            // 브로드캐스트 전용 메서드 사용
            broadcastBidList(productId, bid);

        } catch (Exception e) {
            log.error("입찰 메시지 처리 실패", e);
        }
    }

    public void broadcastBidList(Long productId, Bid newBid) {
        try {
            List<Bid> bidHistory = bidHistoryMap.computeIfAbsent(productId,
                    pid -> bidRepository.findByProductOrderByCreatedAtDesc(newBid.getProduct()));

            if (!bidHistory.contains(newBid)) {
                bidHistory.add(newBid);
                bidHistory.sort((a, b) -> b.getBidPrice().compareTo(a.getBidPrice()));
            }

            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            String json = objectMapper.writeValueAsString(bidHistory);

            Set<WebSocketSession> sessions = productSessions.getOrDefault(productId, Set.of());
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            }

            log.info("입찰 내역 전송 완료: productId={}, 세션수={}, 입찰수={}",
                    productId, sessions.size(), bidHistory.size());

        } catch (Exception e) {
            log.error("입찰 내역 브로드캐스트 실패: productId=" + productId, e);
        }
    }

    private void sendBidHistory(WebSocketSession session, List<Bid> bidHistory) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String json = objectMapper.writeValueAsString(bidHistory);
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(json));
        }
    }

    private Long parseProductId(WebSocketSession session) {
        try {
            URI uri = session.getUri();
            if (uri == null || uri.getQuery() == null) return null;

            Map<String, String> queryMap = Arrays.stream(uri.getQuery().split("&"))
                    .map(param -> param.split("="))
                    .filter(arr -> arr.length == 2)
                    .collect(Collectors.toMap(a -> a[0], a -> a[1]));

            return Long.parseLong(queryMap.get("productId"));
        } catch (Exception e) {
            log.error("productId 파싱 실패", e);
            return null;
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket transport error", exception);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
        productSessions.values().forEach(sessions -> sessions.remove(session));
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
}