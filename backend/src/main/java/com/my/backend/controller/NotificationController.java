package com.my.backend.controller;

import com.my.backend.dto.NotificationDto;
import com.my.backend.entity.Users;
import com.my.backend.enums.NotificationStatus;
import com.my.backend.service.NotificationService;
import com.my.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    // 1) 특정 사용자의 알림 조회
    @GetMapping("/{userId}")
    public List<NotificationDto> getUserNotifications(@PathVariable Long userId) {
        return notificationRepository.findByUserUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 2) 알림 읽음 처리
    @PostMapping("/{notificationId}/read")
    public void markAsRead(@PathVariable Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }
}
