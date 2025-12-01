package com.my.backend.dto;

import com.my.backend.entity.PublicChat;
import com.my.backend.entity.Users;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PublicChatDto {

    private Long publicChatId;
    private Long userId;
    private String content;
    private LocalDateTime createdAt;
    private String nickName;
    private SimpleUserDto user;

    // Entity → DTO
    public static PublicChatDto fromEntity(PublicChat publicChat) {
        if (publicChat == null) return null;

        // SimpleUserDto 생성
        SimpleUserDto userDto = null;
        if (publicChat.getUser() != null) {
            userDto = new SimpleUserDto(publicChat.getUser().getUserId(), publicChat.getUser().getNickName());
        }

        return PublicChatDto.builder()
                .publicChatId(publicChat.getPublicChatId())
                .userId(publicChat.getUser() != null ? publicChat.getUser().getUserId() : null)
                .content(publicChat.getContent())
                .nickName(publicChat.getUser() != null ? publicChat.getUser().getNickName() : null)
                .createdAt(publicChat.getCreatedAt())
                .user(userDto) // 여기에 넣어줘야 프론트에서 msg.user.userId, msg.user.nickName 사용 가능
                .build();
    }

    // DTO → Entity
    public PublicChat toEntity(Users user) {
        return PublicChat.builder()
                .publicChatId(this.publicChatId)
                .user(user)
                .content(this.content)
                .build();
    }
}
