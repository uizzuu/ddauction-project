package com.my.backend.dto;

import lombok.*;

// 경고 요청 DTO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BanRequestDto {
    private Long userId;
    private String reason;
    private Integer banHours; // 제재 시간 (기본 24시간)
}