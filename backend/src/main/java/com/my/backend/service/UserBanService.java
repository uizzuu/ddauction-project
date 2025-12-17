package com.my.backend.service;


import com.my.backend.dto.BanRequestDto;
import com.my.backend.dto.BanResponseDto;
import com.my.backend.dto.BanStatusDto;
import com.my.backend.dto.NotificationDto;
import com.my.backend.entity.Notification;
import com.my.backend.entity.UserBan;
import com.my.backend.entity.Users;
import com.my.backend.enums.NotificationStatus;
import com.my.backend.repository.NotificationRepository;
import com.my.backend.repository.UserRepository;
import com.my.backend.repository.UserBanRepository;
import com.my.backend.websocket.NotificationWebSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserBanService {

    private final UserBanRepository userBanRepository;
    private final UserRepository usersRepository;
    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final NotificationRepository notificationRepository;

    private static final int DEFAULT_BAN_HOURS = 24; // 기본 24시간 제재

    /**
     * 관리자가 경고 버튼을 눌렀을 때 - 유저 제재
     */
    @Transactional
    public BanResponseDto banUser(BanRequestDto request, Long adminId) {
        // 1. 유저 존재 확인
        Users user = usersRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 유저입니다."));

        Users admin = usersRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("관리자 정보를 찾을 수 없습니다."));

        // 2. 이미 활성화된 제재가 있는지 확인
        userBanRepository.findActiveByUserId(request.getUserId())
                .ifPresent(existing -> {
                    throw new RuntimeException("이미 제재 중인 유저입니다.");
                });

        // 3. 제재 시간 설정
        int banHours = request.getBanHours() != null ? request.getBanHours() : DEFAULT_BAN_HOURS;
        LocalDateTime banUntil = LocalDateTime.now().plusHours(banHours);

        String reason = "※경고 " + banHours + "시간동안 채팅이 제한되었습니다.";

        // 4. 제재 생성
        UserBan ban = UserBan.builder()
                .user(user)
                .bannedBy(admin)
                .banUntil(banUntil)
                .reason(reason)
                .active(true)
                .build();

        UserBan savedBan = userBanRepository.save(ban);

        log.info("유저 제재: userId={}, bannedBy={}, until={}",
                user.getUserId(), admin.getUserId(), banUntil);

        // 5. 실시간 알림 전송 (WebSocket 등)
        sendBanNotification(user.getUserId(), banUntil, savedBan.getReason());

        return convertToDto(savedBan);
    }

    /**
     * 공개채팅 전송 가능 여부 확인
     */
    @Transactional
    public BanStatusDto checkBanStatus(Long userId) {
        var activeBan = userBanRepository.findActiveByUserId(userId);

        if (activeBan.isEmpty()) {
            return BanStatusDto.builder()
                    .isBanned(false)
                    .build();
        }

        UserBan ban = activeBan.get();

        // 만료 확인 후 자동 해제
        if (ban.isExpired()) {
            ban.setActive(false);
            userBanRepository.save(ban);

            log.info("제재 자동 해제: userId={}, banId={}", userId, ban.getId());
            sendBanLiftedNotification(userId);

            return BanStatusDto.builder()
                    .isBanned(false)
                    .build();
        }

        // 남은 시간 계산
        long remainingMinutes = Duration.between(LocalDateTime.now(), ban.getBanUntil()).toMinutes();

        return BanStatusDto.builder()
                .isBanned(true)
                .banUntil(ban.getBanUntil())
                .reason(ban.getReason())
                .remainingMinutes(remainingMinutes)
                .build();
    }

    /**
     * 관리자가 수동으로 제재 해제
     */
    @Transactional
    public void liftBan(Long banId, Long adminId) {
        UserBan ban = userBanRepository.findById(banId)
                .orElseThrow(() -> new RuntimeException("제재 내역을 찾을 수 없습니다."));

        if (!ban.isActive()) {
            throw new RuntimeException("이미 해제된 제재입니다.");
        }

        ban.setActive(false);
        userBanRepository.save(ban);

        log.info("제재 수동 해제: userId={}, banId={}, by={}",
                ban.getUser().getUserId(), banId, adminId);

        sendBanLiftedNotification(ban.getUser().getUserId());
    }

    /**
     * 특정 유저의 제재 이력 조회
     */
    @Transactional(readOnly = true)
    public List<BanResponseDto> getBanHistory(Long userId) {
        return userBanRepository.findAllByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 모든 활성화된 제재 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<BanResponseDto> getAllActiveBans() {
        return userBanRepository.findAllActiveBans().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // DTO 변환
    private BanResponseDto convertToDto(UserBan ban) {
        return BanResponseDto.builder()
                .banId(ban.getId())
                .userId(ban.getUser().getUserId())
                .userName(ban.getUser().getUserName())
                .reason(ban.getReason())
                .banUntil(ban.getBanUntil())
                .active(ban.isActive())
                .createdAt(ban.getCreatedAt())
                .bannedByName(ban.getBannedBy().getUserName())
                .build();
    }

    // 경고 등록 시
    private void sendBanNotification(Long userId, LocalDateTime banUntil, String reason) {
        // 1️⃣ Notification DTO 생성 (WebSocket용)
        NotificationDto notiDto = NotificationDto.builder()
                .userId(userId)
                .content(reason)
                .build();

        // 2️⃣ WebSocket으로 실시간 전송
        notificationWebSocketHandler.sendNotificationToUser(userId, notiDto);

        // 3️⃣ DB 저장용 Notification 엔티티 생성
        Notification notification = Notification.builder()
                .user(usersRepository.findById(userId).orElseThrow())
                .content(reason)
                .isRead(false)
                .notificationStatus(NotificationStatus.NOTICE) // enum 맞게 설정
                .build();

        // 4️⃣ DB 저장
        notificationRepository.save(notification);
    }

    // 경고 해제 시
    private void sendBanLiftedNotification(Long userId) {
        NotificationDto noti = NotificationDto.builder()
                .userId(userId)
                .content("경고가 해제되었습니다")
                .build();

        notificationWebSocketHandler.sendNotificationToUser(userId, noti);
    }
}