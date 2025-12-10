package com.my.backend.service;

import com.my.backend.dto.NotificationDto;
import com.my.backend.entity.Notification;
import com.my.backend.entity.Users;
import com.my.backend.enums.NotificationStatus;
import com.my.backend.repository.NotificationRepository;
import com.my.backend.websocket.NotificationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketHandler webSocketHandler;

    public void send(Long userId, NotificationStatus status, String content) {
        Notification notification = Notification.builder()
                .user(Users.builder().userId(userId).build())
                .notificationStatus(status)
                .content(content)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);

        NotificationDto dto = NotificationDto.fromEntity(saved);
        webSocketHandler.sendNotificationToUser(userId, dto);
    }

    // 경매 낙찰 알림
    public void sendBidWinNotification(Users user, String productTitle) {
        send(user.getUserId(), NotificationStatus.BID_WIN,
                String.format("참여하신 '%s' 경매가 낙찰되었습니다! 결제를 진행해주세요.", productTitle));
    }

    // 경매 유찰 알림
    public void sendAuctionEndNotification(Users user, String productTitle) {
        send(user.getUserId(), NotificationStatus.SYSTEM,
                String.format("상품 '%s'의 경매가 종료되었습니다.", productTitle));
    }

    // 새로운 입찰 알림 (판매자)
    public void sendNewBidToSeller(Users seller, String productTitle, long bidPrice) {
        send(seller.getUserId(), NotificationStatus.SYSTEM,
                String.format("상품 '%s'에 새 입찰이 있습니다: %d원", productTitle, bidPrice));
    }

    // 새로운 입찰 알림 (다른 입찰자)
    public void sendNewBidToOtherBidder(Users bidder, String productTitle, long bidPrice) {
        send(bidder.getUserId(), NotificationStatus.SYSTEM,
                String.format("상품 '%s'에 다른 사용자가 %d원 입찰했습니다.", productTitle, bidPrice));
    }
}
