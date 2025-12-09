package com.my.backend.service;

import com.my.backend.dto.ProductDto;
import com.my.backend.entity.BookMark;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import com.my.backend.repository.BookMarkRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookMarkService {

    private final BookMarkRepository bookMarkRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    // 로그인 유저 기준으로 찜/해제 토글
    @Transactional
    public boolean toggleBookMark(Long userId, Long productId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("상품이 존재하지 않습니다."));

        return bookMarkRepository.findByUserAndProduct(user, product)
                .map(bookMark -> {
                    bookMarkRepository.delete(bookMark);
                    return false; // 찜 해제됨
                })
                .orElseGet(() -> {
                    BookMark newBookMark = BookMark.builder()
                            .user(user)
                            .product(product)
                            .build();
                    bookMarkRepository.save(newBookMark);
                    return true; // 찜 추가됨
                });
    }

    // 특정 상품의 찜 수 조회
    public Long getBookMarkCount(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("상품이 존재하지 않습니다."));
        return bookMarkRepository.countByProduct(product);
    }

    // 로그인 유저가 특정 상품을 찜했는지 확인
    public boolean isBookMarked(Long userId, Long productId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("상품이 존재하지 않습니다."));
        return bookMarkRepository.findByUserAndProduct(user, product).isPresent();
    }

    // 로그인 유저 기준 찜한 상품 목록 조회 (마이페이지)
    public List<ProductDto> getBookMarkedProducts(Long userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));

        List<BookMark> bookmarks = bookMarkRepository.findAllByUser(user);
        return bookmarks.stream()
                .map(b -> productService.convertToDto(b.getProduct()))
                .collect(Collectors.toList());
    }

    public List<ProductDto> getTopBookmarkedProducts(int topN) {
        Pageable pageable = PageRequest.of(0, topN);
        List<Product> products = bookMarkRepository.findTopBookmarkedProducts(pageable);
        return products.stream().map(productService::convertToDto).collect(Collectors.toList());
    }
}
