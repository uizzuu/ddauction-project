package com.my.backend.service;

import com.my.backend.dto.BusinessVerifyDto;
import com.my.backend.entity.Users;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.my.backend.myjwt.JWTUtil; // 이미 import 되어 있음
import org.springframework.transaction.annotation.Transactional; // import 되어 있음

@Service
@RequiredArgsConstructor
public class BusinessVerifyService {

    private final NtsApiClient ntsApiClient;
    private final UserRepository userRepository;
    private final JWTUtil jwtUtil; // 💡 JWTUtil이 이미 주입되어 있어 사용 가능

    // userId null 체크 추가, 예외 메시지 구체화
    @Transactional // 💡 DB 저장과 토큰 생성을 하나의 작업 단위로 묶기 위해 추가
    public BusinessVerifyDto verifyAndSave(Long userId, BusinessVerifyDto dto) {
        if (userId == null) {
            throw new IllegalArgumentException("유저 ID가 없습니다. JWT 인증 확인 필요"); // 수정된 부분
        }

        // 1. 사업자번호 유효성 검사
        boolean result = ntsApiClient.verify(dto.getBusinessNumber());
        dto.setValid(result);

        if (result) {
            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("해당 ID의 유저를 찾을 수 없습니다")); // 메시지 수정

            // 2. DB 업데이트
            user.setBusinessNumber(dto.getBusinessNumber()); // 기존 정보 유지하면서 사업자번호만 등록
            Users updatedUser = userRepository.save(user); // 💡 업데이트된 엔티티를 반환받습니다.

            // 3. 💡 핵심: 업데이트된 사용자 정보로 새 JWT 토큰 생성
            String newToken = jwtUtil.createJwt(
                    updatedUser.getUserId(),
                    updatedUser.getEmail(),
                    updatedUser.getRole(),
                    updatedUser.getNickName(),
                    updatedUser.getBusinessNumber(), // DB에 저장된 최신 사업자 번호를 JWT에 포함
                    // JWT 유효기간 (예시: 1시간 = 3600000L. 실제 값은 환경 변수로 관리 권장)
                    3600000L
            );

            // 4. 💡 DTO에 새 토큰을 담아 반환
            // (BusinessVerifyDto에 String newToken 필드가 추가되어 있어야 합니다!)
            dto.setNewToken(newToken);
        }

        return dto;
    }
}