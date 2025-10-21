package com.my.backend.service;

import com.my.backend.dto.ProductDto;
import com.my.backend.dto.BidDto;
import com.my.backend.entity.*;
import com.my.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PaymentRepository paymentRepository;

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

        Bid bid = null;
        if (productDto.getBidId() != null) {
            bid = bidRepository.findById(productDto.getBidId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "입찰자가 존재하지 않습니다."));
        }

        Payment payment = null;
        if (productDto.getPaymentId() != null) {
            payment = paymentRepository.findById(productDto.getPaymentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "결제가 존재하지 않습니다."));
        }

        Product product = productDto.toEntity(seller, bid, payment, category);

        if (productDto.getStartingPrice() != null) {
            try {
                product.setStartingPrice(Long.parseLong(productDto.getStartingPrice()));
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

        Bid bid = null;
        if (updatedProductDto.getBidId() != null) {
            bid = bidRepository.findById(updatedProductDto.getBidId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "입찰자가 존재하지 않습니다."));
        }

        Payment payment = null;
        if (updatedProductDto.getPaymentId() != null) {
            payment = paymentRepository.findById(updatedProductDto.getPaymentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "결제가 존재하지 않습니다."));
        }

        Category category = categoryRepository.findById(updatedProductDto.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "카테고리가 존재하지 않습니다."));

        product.setTitle(updatedProductDto.getTitle());
        product.setContent(updatedProductDto.getContent());

        if (updatedProductDto.getStartingPrice() != null) {
            try {
                product.setStartingPrice(Long.parseLong(updatedProductDto.getStartingPrice()));
            } catch (NumberFormatException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "가격 형식이 잘못되었습니다.");
            }
        }

        product.setImageUrl(updatedProductDto.getImageUrl());
        product.setOneMinuteAuction(updatedProductDto.isOneMinuteAuction());
        product.setAuctionEndTime(updatedProductDto.getAuctionEndTime());
        product.setProductStatus(updatedProductDto.getProductStatus());
        product.setBid(bid);
        product.setPayment(payment);
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

    // 입찰 처리
    public BidDto placeBid(Long productId, Long userId, Long price) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품이 존재하지 않습니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자가 존재하지 않습니다."));

        // 최고 입찰가 조회
        Long highestBidPrice = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .map(Bid::getBidPrice)
                .orElse(product.getStartingPrice() != null ? product.getStartingPrice() : 0L);

        if (price <= highestBidPrice) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "입찰 금액은 현재 최고 입찰가보다 높아야 합니다.");
        }

        Bid bid = Bid.builder()
                .product(product)
                .user(user)
                .bidPrice(price)
                .createdAt(LocalDateTime.now())
                .build();

        bid = bidRepository.save(bid);
        return BidDto.fromEntity(bid);
    }

    // 최고 입찰가만 가져오기 (DTO 건드리지 않음)
    public Long getHighestBidPrice(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품이 존재하지 않습니다."));
        return bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .map(Bid::getBidPrice)
                .orElse(product.getStartingPrice() != null ? product.getStartingPrice() : 0L);
    }
}
