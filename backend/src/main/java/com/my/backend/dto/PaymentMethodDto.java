package com.my.backend.dto;

import com.my.backend.entity.PaymentMethod;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentMethodDto {

    private Long paymentMethodId;
    private String name;

    // Entity → DTO
    public static PaymentMethodDto fromEntity(PaymentMethod method) {
        if (method == null) return null;

        return PaymentMethodDto.builder()
                .paymentMethodId(method.getPaymentMethodId())
                .name(method.getName())
                .build();
    }

    // DTO → Entity
    public PaymentMethod toEntity() {
        return PaymentMethod.builder()
                .paymentMethodId(this.paymentMethodId)
                .name(this.name)
                .build();
    }
}
