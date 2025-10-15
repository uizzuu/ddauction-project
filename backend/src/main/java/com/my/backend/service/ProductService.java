package com.my.backend.service;

import com.my.backend.dto.ProductDto;
import com.my.backend.entity.Product;
import com.my.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    // 모든 상품 조회 (DTO 변환)
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 특정 상품 조회
    public ProductDto getProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("상품이 존재하지 않습니다."));
        return ProductDto.fromEntity(product);
    }

    // 새 상품 생성
    public ProductDto createProduct(ProductDto productDto) {
        Product product = productDto.toEntity();
        Product savedProduct = productRepository.save(product);
        return ProductDto.fromEntity(savedProduct);
    }

    // 상품 수정
    public ProductDto updateProduct(Long id, ProductDto updatedProductDto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("상품이 존재하지 않습니다."));

        // 필드 매핑
        product.setTitle(updatedProductDto.getTitle());
        product.setContent(updatedProductDto.getContent());
        product.setPrice(updatedProductDto.getPrice());
        product.setImageUrl(updatedProductDto.getImageUrl());
        product.setOneMinuteAuction(updatedProductDto.isOneMinuteAuction());
        product.setAuctionEndTime(updatedProductDto.getAuctionEndTime());
        product.setProductStatus(updatedProductDto.getProductStatus());
        product.setPaymentStatus(updatedProductDto.getPaymentStatus());
        product.setPaymentUserId(updatedProductDto.getPaymentUserId());
        product.setAmount(updatedProductDto.getAmount());

        Product savedProduct = productRepository.save(product);
        return ProductDto.fromEntity(savedProduct);
    }

    // 상품 삭제
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }
}
