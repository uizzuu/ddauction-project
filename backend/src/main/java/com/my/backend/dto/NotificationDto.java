package com.my.backend.dto;

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
    private NotificationStatus notificationStatus;
    private String content;
    private Boolean isRead;
    private LocalDateTime createdAt;

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
