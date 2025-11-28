package com.my.backend.entity;

import com.my.backend.enums.ImageType;
import com.my.backend.enums.ProductType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "image")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageId;

    @NotBlank
    @Column(nullable = false)
    private String imagePath; // S3 URL

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ImageType imageType;  // PRODUCT, USER, REVIEW

    @Enumerated(EnumType.STRING)
    private ProductType productType; // AUCTION, USED, STORE (PRODUCT 이미지일 경우만)

    @Column(nullable = false)
    private Long refId; // 실제 참조 대상 ID (상품ID, 유저ID, 리뷰ID)
}
