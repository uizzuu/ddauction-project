package com.my.backend.dto;

import com.my.backend.entity.Qna;
import com.my.backend.entity.User;
import com.my.backend.entity.Product;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class QnaDto {
    private Long qnaId;
    private Long userId;
    private Long productId;
    private String title;
    private String question;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static QnaDto fromEntity(Qna qna) {
        if (qna == null) {
            return null;
        }
        return QnaDto.builder()
                .qnaId(qna.getQnaId())
                .userId(qna.getUser().getUserId())
                .productId(qna.getProduct().getProductId())
                .title(qna.getTitle())
                .question(qna.getQuestion())
                .createdAt(qna.getCreatedAt())
                .updatedAt(qna.getUpdatedAt())
                .build();
    }

    public Qna toEntity(User user, Product product) {
        return Qna.builder()
                .qnaId(this.qnaId)
                .user(user)
                .product(product)
                .title(this.title)
                .question(this.question)
                .build();
    }
}
