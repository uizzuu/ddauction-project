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
    private ProductType productType;
    private ImageType imageType;
    private String imagePath;
    private LocalDateTime createdAt;

    // Entity → DTO
    public static ImageDto fromEntity(Image image) {
        if (image == null) return null;

        return ImageDto.builder()
                .imageId(image.getImageId())
                .productType(image.getProductType())
                .imageType(image.getImageType())
                .imagePath(image.getImagePath())
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
                .build();
    }
}
