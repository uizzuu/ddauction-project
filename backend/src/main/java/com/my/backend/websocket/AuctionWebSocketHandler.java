package com.my.backend.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.my.backend.common.enums.ProductStatus;
import com.my.backend.dto.BidResponse;
import com.my.backend.entity.Bid;
import com.my.backend.entity.Product;
import com.my.backend.repository.BidRepository;
import com.my.backend.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
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
//
//    private static final String ATTR_USER_ID = "USER_ID";
//    private static final String ATTR_PRODUCT_ID = "PRODUCT_ID";
//
//    private final AuctionService auctionService;
//    private final JwtTokenProvider tokenProvider;
//    private final ObjectMapper objectMapper; // 전역 설정을 따르도록 주입
//
//    /** productId -> (sessionId -> session) */
//    private final Map<Long, Map<String, WebSocketSession>> auctionRooms = new ConcurrentHashMap<>();
//    /** sessionId -> productId (세션 정리 O(1)용 인덱스) */
//    private final Map<String, Long> sessionRoomIndex = new ConcurrentHashMap<>();
//
//    @Override
//    public void afterConnectionEstablished(WebSocketSession session) {
//        log.info("[WS] connected: {}", session.getId());
//    }
//
//    @Override
//    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
//        // 텍스트 프레임만 허용
//        if (!(message instanceof TextMessage)) {
//            sendError(session, "UNSUPPORTED_FRAME", "Only text messages are supported.");
//            return;
//        }
//
//        final String payload = ((TextMessage) message).getPayload();
//        final BidMessage bidMessage;
//        try {
//            bidMessage = objectMapper.readValue(payload, BidMessage.class);
//        } catch (JsonProcessingException e) {
//            sendError(session, "BAD_JSON", "Invalid JSON format.");
//            return;
//        }
//
//        if (bidMessage.getType() == null) {
//            sendError(session, "MISSING_TYPE", "Message 'type' is required.");
//            return;
//        }
//
//        switch (bidMessage.getType()) {
//            case "JOIN":
//                handleJoin(session, bidMessage);
//                break;
//
//            case "BID":
//                handleBid(session, bidMessage);
//                break;
//
//            case "LEAVE":
//                handleLeave(session, bidMessage);
//                break;
//
//            default:
//                sendError(session, "UNKNOWN_TYPE", "Unsupported message type: " + bidMessage.getType());
//        }
//    }
//
//    /** JOIN: 토큰 검증 + 세션 컨텍스트 저장 + 룸 등록 */
//    private void handleJoin(WebSocketSession session, BidMessage msg) throws IOException {
//        if (msg.getToken() == null || msg.getProductId() == null) {
//            sendError(session, "MISSING_FIELDS", "JOIN requires 'token' and 'productId'.");
//            return;
//        }
//
//        if (!tokenProvider.validateToken(msg.getToken())) {
//            sendError(session, "INVALID_TOKEN", "Invalid token.");
//            return;
//        }
//
//        final Long userId = tokenProvider.getUserIdFromToken(msg.getToken());
//        final Long productId = msg.getProductId();
//
//        // 세션 컨텍스트 저장
//        session.getAttributes().put(ATTR_USER_ID, userId);
//        session.getAttributes().put(ATTR_PRODUCT_ID, productId);
//
//        // 룸 등록
//        auctionRooms.computeIfAbsent(productId, k -> new ConcurrentHashMap<>())
//                .put(session.getId(), session);
//        sessionRoomIndex.put(session.getId(), productId);
//
//        log.info("[WS] JOIN: session={}, userId={}, productId={}", session.getId(), userId, productId);
//
//        // 선택: JOIN ACK
//        sendJson(session, Map.of(
//                "type", "JOIN_ACK",
//                "productId", productId,
//                "userId", userId
//        ));
//    }
//
//    /** BID: 세션 컨텍스트 기반 처리 + 금액 Long 변환 + 서비스 호출 + 브로드캐스트 */
//    private void handleBid(WebSocketSession session, BidMessage msg) throws IOException {
//        final Long sessionUserId = (Long) session.getAttributes().get(ATTR_USER_ID);
//        final Long sessionProductId = (Long) session.getAttributes().get(ATTR_PRODUCT_ID);
//
//        if (sessionUserId == null || sessionProductId == null) {
//            sendError(session, "NOT_JOINED", "You must JOIN the room before bidding.");
//            return;
//        }
//
//        // 메시지에 productId가 왔다면 세션과 일치하는지 확인 (보안/정합성)
//        if (msg.getProductId() != null && !sessionProductId.equals(msg.getProductId())) {
//            sendError(session, "ROOM_MISMATCH", "productId does not match joined room.");
//            return;
//        }
//
//        // bidPrice → Long 변환 (서비스 시그니처 맞춤)
//        Long bidPriceLong;
//        try {
//            // BidMessage.bidPrice 타입이 Double/BigDecimal/Long 등 무엇이든 안전하게 Long으로
//            Object raw = msg.getBidPrice();
//            if (raw == null) {
//                sendError(session, "MISSING_FIELDS", "BID requires 'bidPrice'.");
//                return;
//            }
//            if (raw instanceof Number) {
//                if (raw instanceof Long) {
//                    bidPriceLong = (Long) raw;
//                } else if (raw instanceof Integer) {
//                    bidPriceLong = ((Integer) raw).longValue();
//                } else if (raw instanceof Double || raw instanceof Float) {
//                    // 부동소수일 경우 반올림 없이 '원단위' 사용 가정 → 내림(또는 반올림 정책 적용 가능)
//                    bidPriceLong = BigDecimal.valueOf(((Number) raw).doubleValue()).longValue();
//                } else if (raw instanceof BigDecimal) {
//                    bidPriceLong = ((BigDecimal) raw).longValue();
//                } else {
//                    bidPriceLong = Long.parseLong(raw.toString());
//                }
//            } else {
//                bidPriceLong = Long.parseLong(raw.toString());
//            }
//        } catch (Exception ex) {
//            sendError(session, "BAD_PRICE", "Invalid bidPrice.");
//            return;
//        }
//
//        try {
//            auctionService.placeBid(sessionProductId, sessionUserId, BigDecimal.valueOf(bidPriceLong));
//
//            // 브로드캐스트 (발신자 포함; 제외하려면 아래 주석 참고)
//            String payload = objectMapper.writeValueAsString(Map.of(
//                    "type", "BID_UPDATE",
//                    "productId", sessionProductId,
//                    "userId", sessionUserId,
//                    "bidPrice", bidPriceLong
//            ));
//            broadcastToRoom(sessionProductId, new TextMessage(payload)
//                    // , session  // ← 발신자 제외하려면 오버로드 만들어 이 세션만 제외
//            );
//
//        } catch (Exception e) {
//            sendError(session, "BID_FAILED", e.getMessage());
//        }
//    }
//
//    /** LEAVE: 룸/인덱스 O(1) 정리 + ACK */
//    private void handleLeave(WebSocketSession session, BidMessage msg) throws IOException {
//        Long productId = (Long) session.getAttributes().get(ATTR_PRODUCT_ID);
//        if (productId == null && msg.getProductId() != null) {
//            productId = msg.getProductId();
//        }
//        removeFromRoom(session, productId);
//        sendJson(session, Map.of("type", "LEAVE_ACK", "productId", productId));
//    }
//
//    /** 룸에 브로드캐스트 (필요 시 발신자 제외 옵션화 가능) */
//    private void broadcastToRoom(Long productId, TextMessage message/*, WebSocketSession exclude*/) {
//        Map<String, WebSocketSession> room = auctionRooms.get(productId);
//        if (room == null) return;
//
//        room.values().forEach(s -> {
//            try {
//                if (s.isOpen() /* && (exclude == null || !exclude.getId().equals(s.getId())) */) {
//                    s.sendMessage(message);
//                }
//            } catch (IOException e) {
//                log.warn("[WS] send failed: session={}, err={}", s.getId(), e.toString());
//            }
//        });
//    }
//
//    /** 룸/인덱스에서 세션 제거 (빈 룸은 정리) */
//    private void removeFromRoom(WebSocketSession session, Long productIdOrNull) {
//        try {
//            Long pid = productIdOrNull != null ? productIdOrNull : sessionRoomIndex.get(session.getId());
//            if (pid != null) {
//                Map<String, WebSocketSession> room = auctionRooms.get(pid);
//                if (room != null) {
//                    room.remove(session.getId());
//                    if (room.isEmpty()) {
//                        auctionRooms.remove(pid);
//                    }
//                }
//            }
//        } finally {
//            sessionRoomIndex.remove(session.getId());
//            session.getAttributes().remove(ATTR_PRODUCT_ID);
//            session.getAttributes().remove(ATTR_USER_ID);
//        }
//    }
//
//    private void sendError(WebSocketSession session, String code, String message) throws IOException {
//        sendJson(session, Map.of("type", "ERROR", "code", code, "message", message));
//    }
//
//    private void sendJson(WebSocketSession session, Object obj) throws IOException {
//        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(obj)));
//    }
//
//    @Override
//    public void handleTransportError(WebSocketSession session, Throwable exception) {
//        log.error("[WS] error: session={}, err={}", session.getId(), exception.toString());
//    }
//
//    @Override
//    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
//        removeFromRoom(session, null); // 인덱스 기반 O(1) 정리
//        log.info("[WS] closed: {}, status={}", session.getId(), status);
//    }
//
//    @Override
//    public boolean supportsPartialMessages() {
//        return false;
//    }


    /// /////////////////////////////////////// 작업
    // 접속된 세션을 저장할 Set
//    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
//
//    @Override
//    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
//        sessions.add(session);
//        log.info("새 세션 연결: {}", session.getId());
//    }
//
//    @Override
//    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
//        String payload = message.getPayload().toString();
//        log.info("받은 메시지: {}", payload);
//
//        // 모든 접속 세션에 메시지 브로드캐스트
//        for (WebSocketSession s : sessions) {
//            if (s.isOpen()) {
//                s.sendMessage(new TextMessage(payload));
//            }
//        }
//    }
//
//    @Override
//    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
//        log.error("WebSocket 오류: {}", exception.getMessage());
//    }
//
//    @Override
//    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
//        sessions.remove(session);
//        log.info("세션 종료: {}", session.getId());
//    }
//
//    @Override
//    public boolean supportsPartialMessages() {
//        return false;
//    }
// productSessions.computeIfAbsent(productId, k -> ConcurrentHashMap.newKeySet()).add(session);

            // productId → 해당 상품을 보는 세션 목록
            private final Map<Long, Set<WebSocketSession>> productSessions = new ConcurrentHashMap<>();
            private final Map<Long, List<Bid>> bidHistoryMap = new ConcurrentHashMap<>();

            private final BidRepository bidRepository;
            private final ProductRepository productRepository;

            @PostConstruct
            public void initAuctionWebSocketHandler() throws JsonProcessingException {
                List<Product> activeProductList = productRepository.findByProductStatus(ProductStatus.ACTIVE);
                for(Product product : activeProductList) {
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
    public void handleTransportError(WebSocketSession session, Throwable exception) {}

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
        productSessions.values().forEach(sessions -> sessions.remove(session));
    }

    @Override
    public boolean supportsPartialMessages() { return false; }

}
