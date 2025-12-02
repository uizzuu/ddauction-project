package com.my.backend.dto;

import com.my.backend.entity.ChatRoom;
import com.my.backend.entity.Users;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatRoomDto {

    private Long chatRoomId;
    private Long sellerId;
    private String sellerNickName;
    private Long senderId;
    private String senderNickName;
    private Long productId;
    private LocalDateTime createdAt;

    // Entity → DTO
    public static ChatRoomDto fromEntity(ChatRoom chatRoom) {
        if (chatRoom == null) return null;

        return ChatRoomDto.builder()
                .chatRoomId(chatRoom.getId())
                .sellerId(chatRoom.getSeller() != null ? chatRoom.getSeller().getUserId() : null)
                .sellerNickName(chatRoom.getSeller() != null ? chatRoom.getSeller().getNickName() : null)
                .senderId(chatRoom.getSender() != null ? chatRoom.getSender().getUserId() : null)
                .senderNickName(chatRoom.getSender() != null ? chatRoom.getSender().getNickName() : null)
                .productId(chatRoom.getProduct() != null ? chatRoom.getProduct().getProductId() : null)
                .createdAt(chatRoom.getCreatedAt())
                .build();
    }

    // DTO → Entity (필요할 경우)
    public ChatRoom toEntity(Users seller, Users sender, com.my.backend.entity.Product product) {
        return ChatRoom.builder()
                .id(this.chatRoomId)
                .seller(seller)
                .sender(sender)
                .product(product)
                .build();
    }
}
