package com.my.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.my.backend.common.enums.PaymentStatus;
import com.my.backend.common.enums.ProductStatus;
import com.my.backend.entity.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static com.my.backend.entity.QImage.image;

@Data
@Builder
public class ProductDto {

    private Long productId;

    private Long sellerId;

    private String sellerNickName;

    private String title;

    private String content;

    @Min(value = 1, message = "시작 가격은 1원 이상이어야 합니다.")
    private Long startingPrice;

    private Long imageId;

    private boolean oneMinuteAuction;

    @NotNull(message = "경매 종료 시간은 필수 입력 항목입니다.")
    @JsonFormat(shape = JsonFormat.Shape.STRING,
            pattern = "yyyy-MM-dd'T'HH:mm:ss") // ✨ 추가
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

        return ProductDto.builder()
                .productId(product.getProductId())
                .sellerId(product.getUser() != null ? product.getUser().getUserId() : null)
                .sellerNickName(product.getUser() != null ? product.getUser().getNickName() : null) // ⭐ 추가
                .title(product.getTitle())
                .content(product.getContent())
                .startingPrice(product.getStartingPrice() != null ? product.getStartingPrice() : null)
                .imageId(product.getImage()!= null ? product.getImage().getImageId() : null)
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

//    public Product toEntity(User seller, Bid bid, Payment payment, Category category, Image image) {
//
//        // image는 nullable=false이므로 체크 필수
//        if (image == null && category != null) {
//            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "최소 1개의 이미지가 필요합니다");
//        }
//
//        return Product.builder()
//                .productId(this.productId)
//                .user(seller)
//                .title(this.title)
//                .content(this.content)
//                .startingPrice(this.startingPrice)
//                .image(image)
//                .oneMinuteAuction(this.oneMinuteAuction)
//                .auctionEndTime(this.auctionEndTime)
//                .productStatus(this.productStatus)
//                .paymentStatus(this.paymentStatus)
//                .bid(bid)
//                .payment(payment)
//                .category(category)
//                .build();
//    }

            // 기존 작업 주석처리 완료 후 추가완료.
            public Product toEntity(User seller, Bid bid, Payment payment, Category category, Image image) {
                if (category == null || category.getCategoryId() == null || category.getCategoryId() <= 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 카테고리입니다.");
                }
                return Product.builder()
                        .productId(this.productId)
                        .user(seller)
                        .title(this.title)
                        .content(this.content)
                        .startingPrice(this.startingPrice)
                        .image(image) // 초기 null 허용
                        .oneMinuteAuction(this.oneMinuteAuction)
                        .auctionEndTime(this.auctionEndTime)
                        .productStatus(this.productStatus != null ? this.productStatus : ProductStatus.ACTIVE)
                        .paymentStatus(this.paymentStatus != null ? this.paymentStatus : PaymentStatus.PENDING)
                        .bid(bid)
                        .payment(payment)
                        .category(category)
                        .build();
            }
}
