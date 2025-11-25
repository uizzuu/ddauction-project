package com.my.backend.dto;

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
    private String nickName;   // 읽기용 닉네임
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity → DTO
    public static PrivateChatDto fromEntity(PrivateChat chat) {
        if (chat == null) return null;

        return PrivateChatDto.builder()
                .privateChatId(chat.getPrivateChatId())
                .userId(chat.getUser() != null ? chat.getUser().getUserId() : null)
                .nickName(chat.getUser() != null ? chat.getUser().getNickName() : null)
                .content(chat.getContent())
                .createdAt(chat.getCreatedAt())
                .updatedAt(chat.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public PrivateChat toEntity(Users user) {
        return PrivateChat.builder()
                .privateChatId(this.privateChatId)
                .user(user)
                .content(this.content)
                .build();
    }
}
