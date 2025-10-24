package com.my.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 입찰 금액 그래프 데이터 DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BidChartData {

    private Integer bidNumber;           // X축: 입찰번호 (1, 2, 3, ...)
    private Long bidPrice;         // Y축: 입찰 금액
    private String bidderNickname;       // 추가: 입찰자 닉네임
}