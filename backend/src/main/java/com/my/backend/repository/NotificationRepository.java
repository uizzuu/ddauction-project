package com.my.backend.repository;

import com.my.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 1) 특정 사용자 모든 알림 조회 (최신순)
    List<Notification> findByUserUserIdOrderByCreatedAtDesc(Long userId);

    // 2) 특정 사용자의 읽지 않은 알림만 조회
    List<Notification> findByUserUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    // 3) 특정 사용자 특정 상태 알림 조회 (선택적)
    List<Notification> findByUserUserIdAndNotificationStatusOrderByCreatedAtDesc(Long userId, com.my.backend.enums.NotificationStatus status);
}
