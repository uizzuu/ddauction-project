package com.my.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "product")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
@EntityListeners(AuditingEntityListener.class)
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User user;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private Long price;

    private String imageUrl;

    private boolean oneMinuteAuction;

    private LocalDateTime auctionEndTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus productStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "payment_user_id")
    private Bidder bidder;

    private Long amount;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    public enum ProductStatus {
        ACTIVE,
        SOLD,
        CLOSED
    }

    public enum PaymentStatus {
        PENDING,
        PAID,
        CANCELLED
    }
}
