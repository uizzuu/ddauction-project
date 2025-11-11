package com.my.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "payment_method")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class PaymentMethod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentMethodId;

    private String name;

}
