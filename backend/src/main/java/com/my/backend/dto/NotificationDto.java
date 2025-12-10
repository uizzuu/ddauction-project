package com.my.backend.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.my.backend.entity.Notification;
import com.my.backend.entity.Users;
import com.my.backend.enums.NotificationStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDto {

    private Long notificationId;
    private Long userId;
    private NotificationStatus notificationStatus; // ✅ 필수 필드
    private String content;
    private Boolean isRead;
    private LocalDateTime createdAt;

    // ✅ WebSocket 전송용 JSON 변환
    public String toJson() {
        try {
            return new ObjectMapper().writeValueAsString(this);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
            return "{}";
        }
    }

    // ✅ notificationStatus 파라미터 추가!
    public static NotificationDto forWebSocket(Long notificationId, Long userId, NotificationStatus status, String content, LocalDateTime createdAt) {
        return NotificationDto.builder()
                .notificationId(notificationId)
                .userId(userId)
                .notificationStatus(status) // ✅ 이게 빠져있었습니다!
                .content(content)
                .isRead(false)
                .createdAt(createdAt)
                .build();
    }

    // Entity → DTO
    public static NotificationDto fromEntity(Notification notification) {
        if (notification == null) return null;

        return NotificationDto.builder()
                .notificationId(notification.getNotificationId())
                .userId(notification.getUser() != null ? notification.getUser().getUserId() : null)
                .notificationStatus(notification.getNotificationStatus())
                .content(notification.getContent())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    // DTO → Entity
    public Notification toEntity(Users user) {
        return Notification.builder()
                .notificationId(this.notificationId)
                .user(user)
                .notificationStatus(this.notificationStatus)
                .content(this.content)
                .isRead(this.isRead)
                .build();
    }
}