package com.my.backend.dto;

import com.my.backend.entity.BookMark;
import com.my.backend.entity.User;
import com.my.backend.entity.Product;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookMarkDto {
    private Long bookmarkId;
    private Long userId;
    private Long productId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static BookMarkDto fromEntity(BookMark bookmark) {
        if (bookmark == null) {
            return null;
        }
        return BookMarkDto.builder()
                .bookmarkId(bookmark.getBookmarkId())
                .userId(bookmark.getUser() != null ? bookmark.getUser().getUserId() : null)
                .productId(bookmark.getProduct() != null ? bookmark.getProduct().getProductId() : null)
                .createdAt(bookmark.getCreatedAt())
                .updatedAt(bookmark.getUpdatedAt())
                .build();
    }

    public BookMark toEntity(User user, Product product) {
        return BookMark.builder()
                .bookmarkId(this.bookmarkId)
                .user(user)
                .product(product)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .build();
    }
}
