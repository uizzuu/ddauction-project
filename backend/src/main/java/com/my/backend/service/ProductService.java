package com.my.backend.service;

import com.my.backend.dto.ProductDto;
import com.my.backend.entity.Bidder;
import com.my.backend.entity.Category;
import com.my.backend.entity.Product;
import com.my.backend.entity.User;
import com.my.backend.repository.BidderRepository;
import com.my.backend.repository.CategoryRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final BidderRepository bidderRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    // 모든 상품 조회
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 특정 상품 조회
    public ProductDto getProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품이 존재하지 않습니다."));
        return ProductDto.fromEntity(product);
    }

    // 새 상품 생성
    public ProductDto createProduct(ProductDto productDto) {
        User seller = userRepository.findById(productDto.getSellerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "판매자가 존재하지 않습니다."));

        Category category = categoryRepository.findById(productDto.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "카테고리가 존재하지 않습니다."));

        // bidder는 null 가능
        Bidder bidder = null;
        if (productDto.getBidderId() != null) {
            bidder = bidderRepository.findById(productDto.getBidderId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "입찰자가 존재하지 않습니다."));
        }

        Product product = productDto.toEntity(seller, bidder, category);

        // price 안전 변환
        if (productDto.getPrice() != null) {
            try {
                product.setPrice(Long.parseLong(productDto.getPrice()));
            } catch (NumberFormatException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "가격 형식이 잘못되었습니다.");
            }
        }

        Product savedProduct = productRepository.save(product);
        return ProductDto.fromEntity(savedProduct);
    }

    // 상품 수정
    public ProductDto updateProduct(Long id, ProductDto updatedProductDto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품이 존재하지 않습니다."));

        Bidder bidder = null;
        if (updatedProductDto.getBidderId() != null) {
            bidder = bidderRepository.findById(updatedProductDto.getBidderId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "입찰자가 존재하지 않습니다."));
        }

        Category category = categoryRepository.findById(updatedProductDto.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "카테고리가 존재하지 않습니다."));

        product.setTitle(updatedProductDto.getTitle());
        product.setContent(updatedProductDto.getContent());
        if (updatedProductDto.getPrice() != null) {
            try {
                product.setPrice(Long.parseLong(updatedProductDto.getPrice()));
            } catch (NumberFormatException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "가격 형식이 잘못되었습니다.");
            }
        }
        product.setImageUrl(updatedProductDto.getImageUrl());
        product.setOneMinuteAuction(updatedProductDto.isOneMinuteAuction());
        product.setAuctionEndTime(updatedProductDto.getAuctionEndTime());
        product.setProductStatus(updatedProductDto.getProductStatus());
        product.setPaymentStatus(updatedProductDto.getPaymentStatus());
        product.setBidder(bidder);
        product.setAmount(updatedProductDto.getAmount());
        product.setCategory(category);

        Product savedProduct = productRepository.save(product);
        return ProductDto.fromEntity(savedProduct);
    }

    // 상품 삭제
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "상품이 존재하지 않습니다.");
        }
        productRepository.deleteById(id);
    }

    // 특정 사용자 판매 상품 조회
    public List<ProductDto> getProductsBySeller(Long userId) {
        return productRepository.findByUserUserId(userId)
                .stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }
}