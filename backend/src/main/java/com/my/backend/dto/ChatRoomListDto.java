package com.my.backend.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomListDto {
    private Long chatRoomId;

    // 상품 정보
    private Long productId;
    private String productTitle;

    // 대화 상대방 정보 (내가 아닌 상대방)
    private Long targetUserId;
    private String targetNickName;

    // 마지막 메시지 정보
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private int unreadCount; // 미구현
}