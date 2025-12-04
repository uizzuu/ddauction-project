package com.my.backend.dto;

import com.my.backend.entity.ProductQna;
import com.my.backend.entity.QnaReview;
import com.my.backend.entity.Users;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QnaReviewDto {

    private Long qnaReviewId;
    private Long qnaUserId;   // 작성자 ID (엔티티: qnaUser)
    private Long productQnaId; // 리뷰 대상 Qna ID (엔티티: qna)
    private String content;
    private String nickName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity → DTO
    public static QnaReviewDto fromEntity(QnaReview qr) {
        if (qr == null) return null;

        return QnaReviewDto.builder()
                .qnaReviewId(qr.getQnaReviewId())
                .qnaUserId(qr.getQnaUser() != null ? qr.getQnaUser().getUserId() : null)
                .productQnaId(qr.getQna() != null ? qr.getQna().getProductQnaId() : null)
                .content(qr.getContent())
                .createdAt(qr.getCreatedAt())
                .updatedAt(qr.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public QnaReview toEntity(Users qnaUser, ProductQna qna) {
        return QnaReview.builder()
                .qnaReviewId(this.qnaReviewId)
                .qnaUser(qnaUser)
                .qna(qna)
                .content(this.content)
                .build();
    }
}
