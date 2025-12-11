package com.my.backend.ban;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BanStatusDto {
    private boolean isBanned;
    private LocalDateTime banUntil;
    private String reason;
    private long remainingMinutes; // 남은 시간 (분)
}
