package com.my.backend.service;

import com.my.backend.dto.NotificationDto;
import com.my.backend.entity.Notification;
import com.my.backend.entity.Users;
import com.my.backend.enums.NotificationStatus;
import com.my.backend.repository.NotificationRepository;
import com.my.backend.repository.UserRepository;
import com.my.backend.websocket.NotificationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketHandler webSocketHandler;
    private final UserRepository usersRepository;

    // ✅ 알림 조회
    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(Long userId) {
        return notificationRepository.findByUserUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ✅ 읽음 처리
    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public void send(Long userId, NotificationStatus status, String content) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .notificationStatus(status)
                .content(content)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        System.out.println("✅ [DB] 알림 저장 완료: ID=" + saved.getNotificationId() + ", userId=" + userId);

        NotificationDto dto = NotificationDto.fromEntity(saved);
        webSocketHandler.sendNotificationToUser(userId, dto);
    }

    public void sendBidWinNotification(Long userId, String productTitle) {
        send(userId, NotificationStatus.BID_WIN,
                String.format("참여하신 '%s' 경매가 낙찰되었습니다! 결제를 진행해주세요.", productTitle));
    }

    public void sendAuctionEndNotification(Long userId, String productTitle) {
        send(userId, NotificationStatus.SYSTEM,
                String.format("상품 '%s'의 경매가 종료되었습니다.", productTitle));
    }

    public void sendNewBidToSeller(Long sellerId, String productTitle, long bidPrice) {
        send(sellerId, NotificationStatus.SYSTEM,
                String.format("상품 '%s'에 새 입찰이 있습니다: %d원", productTitle, bidPrice));
    }

    public void sendNewBidToOtherBidder(Long bidderId, String productTitle, long bidPrice) {
        send(bidderId, NotificationStatus.SYSTEM,
                String.format("상품 '%s'에 다른 사용자가 %d원 입찰했습니다.", productTitle, bidPrice));
    }
}