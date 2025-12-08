package com.my.backend.business;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BusinessVerifyService {

    private final NtsApiClient ntsApiClient;  // ← 패키지명 동일하게 수정

    public BusinessVerifyDto verify(BusinessVerifyDto dto) {
        boolean result = ntsApiClient.verify(dto.getBusinessNumber());
        dto.setValid(result);
        return dto;
    }
}
