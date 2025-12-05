package com.my.backend.dto;

import com.my.backend.entity.ProductQna;
import com.my.backend.entity.Users;
import com.my.backend.enums.ProductType; // 엔티티 기준 ProductType import
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductQnaDto {

    private Long productQnaId;
    private Long userId;
    private String nickName;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long refId;
    private ProductType productType;

    public void setQuestion(String question) { this.content = question; }
    public void setProductId(Long productId) { this.refId = productId; }

    // Entity → DTO
    public static ProductQnaDto fromEntity(ProductQna productQna) {
        if (productQna == null) return null;

        return ProductQnaDto.builder()
                .productQnaId(productQna.getProductQnaId())
                .userId(productQna.getUser() != null ? productQna.getUser().getUserId() : null)
                .title(productQna.getTitle())
                .content(productQna.getContent())
                .createdAt(productQna.getCreatedAt())
                .updatedAt(productQna.getUpdatedAt())
                .refId(productQna.getRefId())
                .productType(productQna.getProductType())
                .build();
    }

    // DTO → Entity
    public ProductQna toEntity(Users user) {
        return ProductQna.builder()
                .productQnaId(this.productQnaId)
                .user(user)
                .title(this.title)
                .content(this.content)
                .refId(this.refId)
                .productType(this.productType)
                .build();
    }
}
