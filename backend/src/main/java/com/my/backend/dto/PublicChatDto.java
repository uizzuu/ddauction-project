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

    // Entity → DTO
    public static PublicChatDto fromEntity(PublicChat publicChat) {
        if (publicChat == null) return null;

        return PublicChatDto.builder()
                .publicChatId(publicChat.getPublicChatId())
                .userId(publicChat.getUser() != null ? publicChat.getUser().getUserId() : null)
                .content(publicChat.getContent())
                .createdAt(publicChat.getCreatedAt())
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
