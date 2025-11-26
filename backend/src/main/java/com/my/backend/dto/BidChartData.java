package com.my.backend.dto;

import lombok.*;

// 입찰 금액 그래프용 dto (그래프 사용 시 필수 dto)
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BidChartData {
    private Integer bidNumber;           // X축: 입찰번호 (1, 2, 3, ...)
    private Long bidPrice;         // Y축: 입찰 금액
    private String bidNickname;       // 추가: 입찰자 닉네임
}