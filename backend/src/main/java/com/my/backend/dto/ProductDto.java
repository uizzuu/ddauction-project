package com.my.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.my.backend.common.enums.PaymentStatus;
import com.my.backend.common.enums.ProductStatus;
import com.my.backend.entity.*;
<<<<<<< HEAD
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
=======
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.jackson.Jacksonized;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@Data
@Builder
@Jacksonized
public class ProductDto {

    private Long productId;

    private Long sellerId;

    private String sellerNickName;

    private String title;

    private String content;

<<<<<<< HEAD
    @Min(value = 1, message = "시작 가격은 1원 이상이어야 합니다.")
=======
    @NotNull
    @Positive
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
    private Long startingPrice;

    private Long imageId;

    private boolean oneMinuteAuction;

    @NotNull(message = "경매 종료 시간은 필수 입력 항목입니다.")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss") // ✨ 추가
    private LocalDateTime auctionEndTime;

    private ProductStatus productStatus;

    private PaymentStatus paymentStatus;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Long bidId;

    private Long paymentId;

    private Long categoryId;

    private List<ImageDto> images;

    public static ProductDto fromEntity(Product product) {
        if (product == null) {
            return null;
        }

        // 엔티티에서 이미지 리스트 가져오기
        List<ImageDto> imageDtos = product.getImages() != null
                ? product.getImages().stream().map(ImageDto::fromEntity).toList()
                : null;

        // 첫 번째 이미지 ID
        Long firstImageId = (product.getImages() != null && !product.getImages().isEmpty())
                ? product.getImages().get(0).getImageId()
                : null;

        return ProductDto.builder()
                .productId(product.getProductId())
                .sellerId(product.getUser() != null ? product.getUser().getUserId() : null)
                .sellerNickName(product.getUser() != null ? product.getUser().getNickName() : null)
                .title(product.getTitle())
                .content(product.getContent())
<<<<<<< HEAD
                .startingPrice(product.getStartingPrice())
                .imageId(firstImageId)
                .images(imageDtos)
=======
                .startingPrice(product.getStartingPrice() != null ? product.getStartingPrice() : null)
                .imageUrl(product.getImageUrl())
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
                .oneMinuteAuction(product.isOneMinuteAuction())
                .auctionEndTime(product.getAuctionEndTime())
                .productStatus(product.getProductStatus())
                .paymentStatus(product.getPaymentStatus())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .bidId(product.getBid() != null ? product.getBid().getBidId() : null)
                .paymentId(product.getPayment() != null ? product.getPayment().getPaymentId() : null)
                .categoryId(product.getCategory() != null ? product.getCategory().getCategoryId() : null)
                .build();
    }

    public Product toEntity(User seller, Bid bid, Payment payment, Category category) {
        Product product = Product.builder()
                .productId(this.productId)
                .user(seller)
                .title(this.title)
                .content(this.content)
                .startingPrice(this.startingPrice)
<<<<<<< HEAD
=======
                .imageUrl(this.imageUrl)
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
                .oneMinuteAuction(this.oneMinuteAuction)
                .auctionEndTime(this.auctionEndTime)
                .productStatus(this.productStatus)
                .paymentStatus(this.paymentStatus)
                .bid(bid)
                .payment(payment)
                .category(category)
                .build();

//        // ⚠️ 이미지마다 product 세팅
//        if (imageEntities != null) {
//            imageEntities.forEach(img -> img.setProduct(product));
//        }

        return product;
    }
<<<<<<< HEAD
}
=======


}
>>>>>>> 38e217f1fd6bb40ed328539545fddb13d58d817a
