package com.my.backend.dto;

import com.my.backend.entity.ChatRoom;
import com.my.backend.entity.PrivateChat;
import com.my.backend.entity.Users;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PrivateChatDto {

    private Long privateChatId;
    private Long userId;
    private String nickName;
    private String content;
    private LocalDateTime createdAt;
    private Long chatRoomId;

    private SimpleUserDto user;

    // Product 정보 추가
    private Long productId;

    // Entity → DTO
    public static PrivateChatDto fromEntity(PrivateChat chat) {
        if (chat == null) return null;

        SimpleUserDto userDto = null;
        if (chat.getUser() != null) {
            userDto = new SimpleUserDto(chat.getUser().getUserId(), chat.getUser().getNickName());
        }

        return PrivateChatDto.builder()
                .privateChatId(chat.getPrivateChatId())
                .userId(chat.getUser() != null ? chat.getUser().getUserId() : null)
                .nickName(chat.getUser() != null ? chat.getUser().getNickName() : null)
                .content(chat.getContent())
                .createdAt(chat.getCreatedAt())
                .chatRoomId(chat.getChatRoom() != null ? chat.getChatRoom().getId() : null)
                .productId(chat.getChatRoom() != null && chat.getChatRoom().getProduct() != null
                        ? chat.getChatRoom().getProduct().getProductId() : null)
                .user(userDto)
                .build();
    }

    // DTO → Entity
    public PrivateChat toEntity(Users user, ChatRoom chatRoom) {
        return PrivateChat.builder()
                .privateChatId(this.privateChatId)
                .user(user)
                .chatRoom(chatRoom)
                .content(this.content)
                .build();
    }
}
