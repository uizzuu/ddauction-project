package com.my.backend.dto;

import com.my.backend.entity.Image;
import com.my.backend.enums.ImageType;
import com.my.backend.enums.ProductType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ImageDto {

    private Long imageId;
    private ProductType productType;  // PRODUCT 이미지일 경우만 값 존재
    private ImageType imageType;      // USER, PRODUCT, REVIEW
    private String imagePath;         // S3 URL
    private Long refId;               // 실제 참조 대상 ID (상품ID, 유저ID, 리뷰ID)
    private LocalDateTime createdAt;

    // Entity → DTO
    public static ImageDto fromEntity(Image image) {
        if (image == null) return null;

        return ImageDto.builder()
                .imageId(image.getImageId())
                .productType(image.getProductType())
                .imageType(image.getImageType())
                .imagePath(image.getImagePath())
                .refId(image.getRefId())      // refId 포함
                .createdAt(image.getCreatedAt())
                .build();
    }

    // DTO → Entity
    public Image toEntity() {
        return Image.builder()
                .imageId(this.imageId)
                .productType(this.productType)
                .imageType(this.imageType)
                .imagePath(this.imagePath)
                .refId(this.refId)           // refId 포함
                .build();
    }
}
