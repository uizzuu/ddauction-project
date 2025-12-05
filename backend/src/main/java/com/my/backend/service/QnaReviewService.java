package com.my.backend.service;

import com.my.backend.dto.QnaReviewDto;
import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.entity.ProductQna;
import com.my.backend.entity.QnaReview;
import com.my.backend.entity.Users;
import com.my.backend.repository.ProductQnaRepository;
import com.my.backend.repository.QnaReviewRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    // 답변 등록 ⭐ 수정됨
    @Transactional
    public QnaReviewDto insertQnaReview(QnaReviewDto qnaReviewDto) {
        if (qnaReviewDto.getContent() == null || qnaReviewDto.getContent().isBlank()) {
            throw new IllegalArgumentException("답변 내용은 필수입니다.");
        }

        // ⭐ JWT 토큰에서 현재 로그인한 사용자 ID 가져오기
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        Long currentUserId = userDetails.getUserId();

        Users qnaUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + currentUserId));

        ProductQna productQna = productQnaRepository.findById(qnaReviewDto.getProductQnaId())
                .orElseThrow(() -> new EntityNotFoundException("문의를 찾을 수 없습니다. id=" + qnaReviewDto.getProductQnaId()));

        QnaReview qnaReview = qnaReviewDto.toEntity(qnaUser, productQna);
        QnaReview saved = qnaReviewRepository.save(qnaReview);
        return QnaReviewDto.fromEntity(saved);
    }

    // 답변 수정 ⭐ 수정됨
    @Transactional
    public QnaReviewDto updateQnaReview(Long id, QnaReviewDto qnaReviewDto) {
        QnaReview qnaReview = qnaReviewRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("답변을 찾을 수 없습니다. id=" + id));

        // ⭐ 권한 체크: 본인만 수정 가능
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        Long currentUserId = userDetails.getUserId();

        if (!qnaReview.getQnaUser().getUserId().equals(currentUserId)) {
            throw new IllegalStateException("본인이 작성한 답변만 수정할 수 있습니다.");
        }

        if (qnaReviewDto.getContent() != null && !qnaReviewDto.getContent().isBlank()) {
            qnaReview.setContent(qnaReviewDto.getContent());
        }

        QnaReview updated = qnaReviewRepository.save(qnaReview);
        return QnaReviewDto.fromEntity(updated);
    }

    // 답변 삭제 ⭐ 수정됨
    @Transactional
    public void deleteQnaReview(Long id) {
        QnaReview qnaReview = qnaReviewRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("답변을 찾을 수 없습니다. id=" + id));

        // ⭐ 권한 체크: 본인 또는 관리자만 삭제 가능
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        Long currentUserId = userDetails.getUserId();
        String role = userDetails.getRole().toString();

        if (!qnaReview.getQnaUser().getUserId().equals(currentUserId) && !"ADMIN".equals(role)) {
            throw new IllegalStateException("삭제 권한이 없습니다.");
        }

        qnaReviewRepository.deleteById(id);
    }
}