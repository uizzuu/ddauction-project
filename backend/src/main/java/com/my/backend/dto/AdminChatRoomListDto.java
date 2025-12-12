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
public class AdminChatRoomListDto { // ⭐ 새로운 DTO 정의

    private Long chatRoomId;

    // 상품 정보 (공통)
    private Long productId;
    private String productTitle;

    // -----------------------------------------------------
    // ⭐ 판매자 정보 (Seller)
    private Long sellerId;
    private String sellerNickName;
    // private String sellerName; // 필요시 추가

    // ⭐ 구매자 정보 (Buyer, ChatRoom 엔티티에서 Sender에 해당)
    private Long buyerId;
    private String buyerNickName;
    // private String buyerName; // 필요시 추가
    // -----------------------------------------------------

    // 마지막 메시지 정보 (공통)
    private String lastMessage;
    private LocalDateTime lastMessageTime;

    // 관리자 뷰에서는 unreadCount는 일반적으로 필요 없습니다.
}