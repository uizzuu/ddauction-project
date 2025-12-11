package com.my.backend.ban;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BanResponseDto {
    private Long banId;
    private Long userId;
    private String userName;
    private String reason;
    private LocalDateTime banUntil;
    private boolean active;
    private LocalDateTime createdAt;
    private String bannedByName;
}