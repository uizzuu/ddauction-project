package com.my.backend.service;

import com.my.backend.dto.QnaReviewDto;
import com.my.backend.entity.ProductQna;
import com.my.backend.entity.QnaReview;
import com.my.backend.entity.Users;
import com.my.backend.repository.ProductQnaRepository;
import com.my.backend.repository.QnaReviewRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QnaReviewService {

    private final QnaReviewRepository qnaReviewRepository;
    private final ProductQnaRepository productQnaRepository;
    private final UserRepository userRepository;

    // 전체 답변 조회
    public List<QnaReviewDto> getAllQnaReviews() {
        return qnaReviewRepository.findAll().stream()
                .map(QnaReviewDto::fromEntity)
                .toList();
    }

    // 단건 조회
    public QnaReviewDto getOneQnaReview(Long id) {
        QnaReview qnaReview = qnaReviewRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("답변을 찾을 수 없습니다. id=" + id));
        return QnaReviewDto.fromEntity(qnaReview);
    }

    // 특정 ProductQna에 대한 모든 답변 조회
    public List<QnaReviewDto> getQnaReviewsByProductQnaId(Long productQnaId) {
        return qnaReviewRepository.findByQnaProductQnaId(productQnaId).stream()
                .map(QnaReviewDto::fromEntity)
                .toList();
    }

    // 특정 사용자(판매자)가 작성한 모든 답변 조회
    public List<QnaReviewDto> getQnaReviewsByUserId(Long userId) {
        return qnaReviewRepository.findByQnaUserUserId(userId).stream()
                .map(QnaReviewDto::fromEntity)
                .toList();
    }

    // 답변 등록
    @Transactional
    public QnaReviewDto insertQnaReview(QnaReviewDto qnaReviewDto) {
        if (qnaReviewDto.getContent() == null || qnaReviewDto.getContent().isBlank()) {
            throw new IllegalArgumentException("답변 내용은 필수입니다.");
        }

        Users qnaUser = userRepository.findById(qnaReviewDto.getQnaUserId())
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + qnaReviewDto.getQnaUserId()));

        ProductQna productQna = productQnaRepository.findById(qnaReviewDto.getProductQnaId())
                .orElseThrow(() -> new EntityNotFoundException("문의를 찾을 수 없습니다. id=" + qnaReviewDto.getProductQnaId()));

        QnaReview qnaReview = qnaReviewDto.toEntity(qnaUser, productQna);
        QnaReview saved = qnaReviewRepository.save(qnaReview);
        return QnaReviewDto.fromEntity(saved);
    }

    // 답변 수정
    @Transactional
    public QnaReviewDto updateQnaReview(Long id, QnaReviewDto qnaReviewDto) {
        QnaReview qnaReview = qnaReviewRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("답변을 찾을 수 없습니다. id=" + id));

        if (qnaReviewDto.getContent() != null && !qnaReviewDto.getContent().isBlank()) {
            qnaReview.setContent(qnaReviewDto.getContent());
        }

        QnaReview updated = qnaReviewRepository.save(qnaReview);
        return QnaReviewDto.fromEntity(updated);
    }

    // 답변 삭제
    @Transactional
    public void deleteQnaReview(Long id) {
        if (!qnaReviewRepository.existsById(id)) {
            throw new EntityNotFoundException("답변을 찾을 수 없습니다. id=" + id);
        }
        qnaReviewRepository.deleteById(id);
    }
}