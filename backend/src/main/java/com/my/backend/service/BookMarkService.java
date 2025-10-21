package com.my.backend.service;

import com.my.backend.entity.BookMark;
import com.my.backend.entity.Product;
import com.my.backend.entity.User;
import com.my.backend.repository.BookMarkRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookMarkService {

    private final BookMarkRepository bookMarkRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional
    public boolean toggleBookMark(Long userId, Long productId) {
        User user = userRepository.findById(userId)
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

    public Long getBookMarkCount(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("상품이 존재하지 않습니다."));
        return bookMarkRepository.countByProduct(product);
    }
}
