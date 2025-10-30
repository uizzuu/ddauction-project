package com.my.backend.dto;

import com.my.backend.entity.Image;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ImageDto {
    private Long imageId;
    private Long productId;  // Product와 연관된 ID
    private String imagePath;

    // Entity -> DTO 변환
    public static ImageDto fromEntity(Image image) {
        return ImageDto.builder()
                .imageId(image.getImageId())
                .productId(image.getProduct() != null ? image.getProduct().getProductId() : null)
                .imagePath(image.getImagePath())
                .build();
    }

    // DTO -> Entity 변환
    public Image toEntity() {
        Image image = Image.builder()
                .imageId(this.imageId)
                .imagePath(this.imagePath)
                .build();

        // Product는 필요하면 나중에 set 해주기
        // image.setProduct(product);

        return image;
    }
}
