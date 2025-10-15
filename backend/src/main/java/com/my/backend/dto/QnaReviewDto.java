package com.my.backend.dto;


import com.my.backend.entity.Qna;
import com.my.backend.entity.QnaReview;
import com.my.backend.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class QnaReviewDto {
    private Long qnaReviewId;
    private Long qnaUserId;
    private Long qnaId;
    private String answer;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static QnaReviewDto fromEntity(QnaReview qr) {
        return QnaReviewDto.builder()
                .qnaReviewId(qr.getQnaReviewId())
                .qnaUserId(qr.getQnaUser().getUserId())
                .qnaId(qr.getQna().getQnaId())
                .answer(qr.getAnswer())
                .createdAt(qr.getCreatedAt())
                .updatedAt(qr.getUpdatedAt())
                .build();
    }

    public QnaReview toEntity(User user, Qna qna) {
        return QnaReview.builder()
                .qnaReviewId(this.qnaReviewId)
                .qnaUser(user)
                .qna(qna)
                .answer(this.answer)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .build();
    }
}

