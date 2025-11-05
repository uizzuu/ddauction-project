package com.my.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

<<<<<<< HEAD
=======
import java.math.BigDecimal;

>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
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
<<<<<<< HEAD
    private String bidNickname;       // 추가: 입찰자 닉네임
=======
    private String bidderNickname;       // 추가: 입찰자 닉네임
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
}