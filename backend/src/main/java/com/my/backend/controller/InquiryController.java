package com.my.backend.controller;

import com.my.backend.dto.ProductQnaDto;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.service.ProductQnaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import java.util.stream.Collectors;

import java.util.HashMap;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/inquiry")
public class InquiryController {

    private final ProductQnaService productQnaService;
    private final JWTUtil jwtUtil;

    private String getTokenFromHeader(String authorizationHeader) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        throw new RuntimeException("유효한 토큰이 없습니다.");
    }

    // 1:1 문의 등록
    @PostMapping
    public ResponseEntity<?> createInquiry(
            @RequestBody ProductQnaDto productQnaDto,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        // JWT에서 userId 추출
        if (authorizationHeader != null) {
            try {
                String token = getTokenFromHeader(authorizationHeader);
                Long userId = jwtUtil.getUserId(token);
                productQnaDto.setUserId(userId);
            } catch (Exception e) {
                // 토큰 파싱 실패 시 기본값으로 진행
                System.out.println("UserId 추출 실패: " + e.getMessage());
            }
        }

        ProductQnaDto created = productQnaService.insertUserQna(productQnaDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "1:1 문의가 등록되었습니다.", "data", created));
    }

    // 마이페이지: 사용자 1:1 문의 조회
    @GetMapping("/user")
    public ResponseEntity<?> getUserInquiries(@RequestHeader("Authorization") String authorizationHeader) {
        String token = getTokenFromHeader(authorizationHeader);
        Long userId = jwtUtil.getUserId(token);

        List<ProductQnaDto> qnaDtos = productQnaService.getUserQnasByUserId(userId);

        List<Map<String, Object>> response = qnaDtos.stream()
                .map(qna -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("inquiryId", qna.getProductQnaId());
                    map.put("title", qna.getTitle());
                    map.put("question", qna.getContent());
                    map.put("createdAt", qna.getCreatedAt());
                    map.put("answers", List.of());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    //  관리자: 모든 1:1 문의 조회
    @GetMapping("/admin")
    public ResponseEntity<?> getAllInquiries() {
        List<ProductQnaDto> qnaDtos = productQnaService.getAllUserQnas();

        // 프론트 기대 형식: { articleId, title, content, createdAt, updatedAt }
        List<Map<String, Object>> response = qnaDtos.stream()
                .map(qna -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("articleId", qna.getProductQnaId());
                    map.put("title", qna.getTitle());
                    map.put("content", qna.getContent());
                    map.put("createdAt", qna.getCreatedAt());
                    map.put("updatedAt", qna.getUpdatedAt() != null ? qna.getUpdatedAt() : qna.getCreatedAt());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // 1:1 문의 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInquiry(@PathVariable Long id) {
        productQnaService.deleteProductQna(id);
        return ResponseEntity.ok(Map.of("message", "1:1 문의가 삭제되었습니다."));
    }

    //  1:1 문의 답변 등록
    @PostMapping("/{id}/answer")
    public ResponseEntity<?> addInquiryAnswer(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        String answer = request.get("answer");
        ProductQnaDto qnaDto = productQnaService.getOneProductQna(id);

        // 기존 content에 답변 추가
        String updatedContent = qnaDto.getContent() + "\n[답변]: " + answer;

        ProductQnaDto updateDto = new ProductQnaDto();
        updateDto.setTitle(qnaDto.getTitle());
        updateDto.setContent(updatedContent);

        productQnaService.updateProductQna(id, updateDto);
        return ResponseEntity.ok(Map.of("message", "답변이 등록되었습니다."));
    }
}



































































































































