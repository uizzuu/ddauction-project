package com.my.backend.dto;

import com.my.backend.entity.BookMark;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookMarkDto {
    private Long bookmarkId;
    private Long userId;       // 작성자 ID
    private Long productId;    // 대상 상품 ID
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity → DTO
    public static BookMarkDto fromEntity(BookMark bookmark) {
        if (bookmark == null) return null;

        return BookMarkDto.builder()
                .bookmarkId(bookmark.getBookmarkId())
                .userId(bookmark.getUser() != null ? bookmark.getUser().getUserId() : null)
                .productId(bookmark.getProduct() != null ? bookmark.getProduct().getProductId() : null)
                .createdAt(bookmark.getCreatedAt())
                .updatedAt(bookmark.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public BookMark toEntity(Users user, Product product) {
        return BookMark.builder()
                .bookmarkId(this.bookmarkId)
                .user(user)
                .product(product)
                .build();
    }
}
