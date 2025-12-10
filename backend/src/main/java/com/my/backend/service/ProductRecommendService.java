package com.my.backend.service;

import com.my.backend.dto.ProductDto;
import com.my.backend.entity.Product;
import com.my.backend.entity.ProductViewLog;
import com.my.backend.entity.Users;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.ProductViewLogRepository;
import com.my.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductRecommendService {

    private final ProductViewLogRepository productViewLogRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /**
     * 특정 상품을 본 사용자들이 본 다른 상품 목록을 추천 (최대 10개)
     * @param productId 기준 상품 ID
     * @return 추천 상품 리스트
     */
    public List<Product> getPeopleAlsoViewed(Long productId) {
        Pageable topTen = PageRequest.of(0, 10);

        // 기준 상품을 본 사용자들이 본 다른 상품 조회, 상위 10개
        List<Product> result = productViewLogRepository.findAlsoViewedProducts(productId, topTen);

        if (result == null || result.isEmpty()) {
            return Collections.emptyList();
        }
        return result;
    }

    /**
     * 상품 상세 조회 & 조회수 증가 & 로그 저장
     * @param productId 상품 ID
     * @param userId 사용자 ID (로그인 시)
     * @return ProductDto
     */
    @Transactional
    public ProductDto getProduct(Long productId, Long userId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("상품 없음"));

        // 조회수 증가
        product.setViewCount(product.getViewCount() + 1);

        // 조회 로그 저장
        if (userId != null) {
            userRepository.findById(userId).ifPresent(user -> {
                ProductViewLog log = new ProductViewLog();
                log.setUser(user);
                log.setProduct(product);
                log.setViewedAt(LocalDateTime.now());
                productViewLogRepository.save(log);
            });
        }

        return ProductDto.fromEntity(product);
    }
}
