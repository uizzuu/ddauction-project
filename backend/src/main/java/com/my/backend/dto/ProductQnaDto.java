package com.my.backend.dto;

import com.my.backend.entity.ProductQna;
import com.my.backend.entity.Users;
import com.my.backend.enums.ProductType;
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
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private ProductType productType;

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
                .productType(this.productType)
                .build();
    }
}
