package com.my.backend.business;

import com.my.backend.entity.Users;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BusinessVerifyService {

    private final NtsApiClient ntsApiClient;
    private final UserRepository userRepository;

    // userId null 체크 추가, 예외 메시지 구체화
    public BusinessVerifyDto verifyAndSave(Long userId, BusinessVerifyDto dto) {
        if (userId == null) {
            throw new IllegalArgumentException("유저 ID가 없습니다. JWT 인증 확인 필요"); // 수정된 부분
        }

        boolean result = ntsApiClient.verify(dto.getBusinessNumber());
        dto.setValid(result);

        if (result) {
            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("해당 ID의 유저를 찾을 수 없습니다")); // 메시지 수정
            user.setBusinessNumber(dto.getBusinessNumber()); // 기존 정보 유지하면서 사업자번호만 등록
            userRepository.save(user);
        }

        return dto;
    }
}
