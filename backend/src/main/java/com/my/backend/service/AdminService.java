package com.my.backend.service;

import com.my.backend.repository.UserRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ReportRepository reportRepository;

    public Map<String, Long> getStats() {
        long userCount = userRepository.count();
        long productCount = productRepository.count();
        long reportCount = reportRepository.count();

        return Map.of(
                "userCount", userCount,
                "productCount", productCount,
                "reportCount", reportCount
        );
    }
}
