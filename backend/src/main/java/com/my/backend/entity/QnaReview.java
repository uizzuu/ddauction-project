package com.my.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "qna_review")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
@EntityListeners(AuditingEntityListener.class)
public class QnaReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long qnaReviewId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User qnaUser;

    @ManyToOne
    @JoinColumn(name = "qna_id", nullable = false)
    private Qna qna;

    private String answer;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
