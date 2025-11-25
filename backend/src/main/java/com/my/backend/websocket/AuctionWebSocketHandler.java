package com.my.backend.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
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
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

//    @PostConstruct
    public void initAuctionWebSocketHandler() throws JsonProcessingException {
        List<Product> activeProductList = productRepository.findByProductStatus(ProductStatus.ACTIVE);
        for (Product product : activeProductList) {
            List<Bid> bidHistory = bidRepository.findByProductProductIdOrderByCreatedAtDesc(product.getProductId());
            bidHistoryMap.put(product.getProductId(), bidHistory);
        }
    }


    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        URI uri = session.getUri();
        if (uri == null || uri.getQuery() == null) {
            log.warn("쿼리 파라미터 없음 - 연결 종료됨: {}", session.getId());
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        // productId 파싱
        String query = uri.getQuery(); // 예: "productId=1"
        Long productId = null;
        try {
            Map<String, String> queryMap = Arrays.stream(query.split("&"))
                    .map(param -> param.split("="))
                    .filter(arr -> arr.length == 2)
                    .collect(Collectors.toMap(a -> a[0], a -> a[1]));
            productId = Long.parseLong(queryMap.get("productId"));
        } catch (Exception e) {
            log.error("productId 파싱 실패: {}", query, e);
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        // 세션 등록
        productSessions.computeIfAbsent(productId, k -> ConcurrentHashMap.newKeySet()).add(session);

        // 입찰 내역 가져오기
        List<Bid> bidHistory = bidHistoryMap.computeIfAbsent(productId,
                id -> bidRepository.findByProductProductIdOrderByCreatedAtDesc(id));

        // DTO 변환
        List<BidResponse> responseList = bidHistory.stream()
                .map(b -> BidResponse.builder()
                        .bidId(b.getBidId())
                        .userId(b.getUser().getUserId())
                        .bidPrice(b.getBidPrice())
                        .createdAt(b.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                        .build())
                .toList();

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String json = objectMapper.writeValueAsString(responseList);

        if (session.isOpen()) {
            session.sendMessage(new TextMessage(json));
        }

        log.info("새 세션 연결: {}, productId={}", session.getId(), productId);
    }

    @Override
//    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {}
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws IOException {
        String payload = message.getPayload().toString();
        log.info("입찰 메시지 수신: {}", payload);

        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> msg = mapper.readValue(payload, Map.class);

            Long productId = null;
            if (session.getUri() != null && session.getUri().getQuery() != null) {
                String query = session.getUri().getQuery(); // e.g. productId=1
                Map<String, String> queryMap = Arrays.stream(query.split("&"))
                        .map(param -> param.split("="))
                        .filter(arr -> arr.length == 2)
                        .collect(Collectors.toMap(a -> a[0], a -> a[1]));
                productId = Long.parseLong(queryMap.get("productId"));
            }

            if (productId == null) {
                log.warn("productId 없음, 무시");
                return;
            }

            // 클라이언트에서 보낸 입찰가
            Double bidPriceDouble = Double.valueOf(msg.get("bidPrice").toString());
            Long bidPrice = bidPriceDouble.longValue();

            // DB 저장
            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) return;

            Bid bid = new Bid();
            bid.setProduct(product);
            bid.setBidPrice(bidPrice);
            bidRepository.save(bid);

            // 모든 세션에 전송
            broadcastBidList(productId, bid);

        } catch (Exception e) {
            log.error("입찰 메시지 처리 실패: {}", e.getMessage(), e);
        }
    }


    // 특정 상품에 대해서만 전송
    public void broadcastBidList(Long productId, Bid bid) {
        try {
            // 1️⃣ 현재 상품의 기존 입찰 내역 가져오기
            List<Bid> bidHistory = bidHistoryMap.get(productId);
            if (bidHistory == null) {
                bidHistory = bidRepository.findByProductProductIdOrderByCreatedAtDesc(productId);
                bidHistoryMap.put(productId, bidHistory);
            } else {
                bidHistory.add(bid);
                bidHistory.sort((a, b) -> b.getBidPrice().compareTo(a.getBidPrice()));
            }

            bidHistoryMap.put(productId, bidHistory);

            List<BidResponse> responseList = bidHistory.stream()
                    .map(b -> BidResponse.builder()
                            .bidId(b.getBidId())
                            .productId(
                                    b.getProduct() != null ? b.getProduct().getProductId() : productId
                            )
                            .userId(
                                    b.getUser() != null ? b.getUser().getUserId() : null
                            )
                            .bidPrice(b.getBidPrice())
                            .createdAt(b.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                            .build())
                    .toList();

            // 6️⃣ JSON 직렬화 (JavaTimeModule 등록)
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            String json = mapper.writeValueAsString(responseList);

            // 7️⃣ 해당 상품을 보고 있는 모든 WebSocket 세션에게 전송
            Set<WebSocketSession> sessions = productSessions.getOrDefault(productId, Set.of());
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(json));
                }
            }

            log.info("입찰 내역 전송 완료: productId={}, 세션수={}, 입찰수={}", productId, sessions.size(), bidHistory.size());

        } catch (Exception e) {
            log.error("입찰 내역 브로드캐스트 실패: productId=" + productId, e);
        }
    }


    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
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
