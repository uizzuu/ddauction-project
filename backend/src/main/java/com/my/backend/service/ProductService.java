package com.my.backend.service;

import com.my.backend.dto.ImageDto;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductCategoryType;
import com.my.backend.enums.ProductStatus;
import com.my.backend.dto.ProductDto;
import com.my.backend.dto.BidDto;
import com.my.backend.entity.*;
import com.my.backend.repository.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final ImageRepository imageRepository;
    private final EntityManager em;

    // 전체 상품 조회
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 단일 상품 조회
    public ProductDto getProduct(Long id) {
        Product product = findProductOrThrow(id);
        return ProductDto.fromEntity(product);
    }

    // 특정 사용자의 판매 상품 조회
    public List<ProductDto> getProductsBySeller(Long userId) {
        return productRepository.findByUserUserId(userId)
                .stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 상품 생성
    public ProductDto createProduct(ProductDto dto) {
        Users seller = findUserOrThrow(dto.getSellerId());
        Bid bid = findBidOrNull(dto.getBidId());
        Payment payment = findPaymentOrNull(dto.getPaymentId());

        Product product = dto.toEntity(seller, bid, payment);

        // 이미지가 있으면 DTO → Entity 변환 후 Product에 추가
        if (dto.getImages() != null && !dto.getImages().isEmpty()) {
            product.getImages().addAll(
                    dto.getImages().stream()
                            .map(ImageDto::toEntity)
                            .toList()
            );
        }

        Product saved = productRepository.save(product);

        return ProductDto.fromEntity(saved);
    }

    // 상품 수정
    public ProductDto updateProduct(Long id, ProductDto dto) {
        Product product = findProductOrThrow(id);
        Users seller = findUserOrThrow(dto.getSellerId());
        Bid bid = findBidOrNull(dto.getBidId());
        Payment payment = findPaymentOrNull(dto.getPaymentId());

        product.setTitle(dto.getTitle());
        product.setContent(dto.getContent());
        if (dto.getStartingPrice() != null) {
            product.setStartingPrice(dto.getStartingPrice());
        }
        product.setSeller(seller);
        product.setTitle(dto.getTitle());
        product.setContent(dto.getContent());
        product.setProductCategoryType(dto.getProductCategoryType());
        product.setStartingPrice(dto.getStartingPrice());
        product.setPrice(dto.getPrice());
        product.setAuctionEndTime(dto.getAuctionEndTime());
        product.setProductStatus(dto.getProductStatus());
        product.setPaymentStatus(dto.getPaymentStatus());
        product.setDeliveryIncluded(dto.isDeliveryIncluded());
        product.setDeliveryPrice(dto.getDeliveryPrice());
        product.setDeliveryAddPrice(dto.getDeliveryAddPrice());
        product.setProductType(dto.getProductType());
        product.setDeliveryType(dto.getDeliveryType());
        product.setTagType(dto.getTagType());
        product.setBid(bid);
        product.setPayment(payment);

        // 이미지 업데이트
        if (dto.getImages() != null && !dto.getImages().isEmpty()) {
            product.getImages().clear();
            product.getImages().addAll(
                    dto.getImages().stream()
                            .map(ImageDto::toEntity)
                            .toList()
            );
        }

        Product saved = productRepository.save(product);
        return ProductDto.fromEntity(saved);
    }

    // 상품 삭제
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "상품이 존재하지 않습니다.");
        }
        productRepository.deleteById(id);
    }

    // 입찰 등록
    public BidDto placeBid(Long productId, Long userId, Long price) {
        Product product = findProductOrThrow(productId);
        Users user = findUserOrThrow(userId);

        Long highestBid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .map(Bid::getBidPrice)
                .orElse(product.getStartingPrice() != null ? product.getStartingPrice() : 0L);

        if (price <= highestBid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "입찰 금액은 현재 최고 입찰가보다 높아야 합니다.");
        }

        Bid bid = Bid.builder()
                .user(user)
                .bidPrice(price)
                .isWinning(false)
                .createdAt(LocalDateTime.now())
                .build();

        Bid saved = bidRepository.save(bid);
        return BidDto.fromEntity(saved);
    }

    // 최고 입찰가 조회
    public Long getHighestBidPrice(Long productId) {
        Product product = findProductOrThrow(productId);
        return bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .map(Bid::getBidPrice)
                .orElse(product.getStartingPrice() != null ? product.getStartingPrice() : 0L);
    }

    // 상품 검색
    public List<ProductDto> searchProducts(String keyword, ProductCategoryType categoryType, ProductStatus status) {
        List<Product> products;

        boolean hasKeyword = keyword != null && !keyword.isEmpty();
        boolean hasCategory = categoryType != null;
        boolean hasStatus = status != null;

        if (hasKeyword && hasCategory && hasStatus) {
            products = productRepository.findByTitleContainingAndProductCategoryTypeAndProductStatus(keyword, categoryType, status);
        } else if (hasKeyword && hasCategory) {
            products = productRepository.findByTitleContainingAndProductCategoryType(keyword, categoryType);
        } else if (hasKeyword && hasStatus) {
            products = productRepository.findByTitleContainingAndProductStatus(keyword, status);
        } else if (hasCategory && hasStatus) {
            products = productRepository.findByProductCategoryTypeAndProductStatus(categoryType, status);
        } else if (hasKeyword) {
            products = productRepository.findByTitleContaining(keyword);
        } else if (hasCategory) {
            products = productRepository.findByProductCategoryType(categoryType);
        } else if (hasStatus) {
            products = productRepository.findByProductStatus(status);
        } else {
            products = productRepository.findAll();
        }

        return products.stream()
                .map(ProductDto::fromEntity)
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
    }

    // 내부 헬퍼 메서드
    private Product findProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품이 존재하지 않습니다."));
    }

    private Users findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자가 존재하지 않습니다."));
    }

    private Image findImageOrNull(Long id) {
        if (id == null) return null;
        return imageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "이미지가 존재하지 않습니다."));
    }

    private Bid findBidOrNull(Long id) {
        if (id == null) return null;
        return bidRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "입찰 정보가 존재하지 않습니다."));
    }

    private Payment findPaymentOrNull(Long id) {
        if (id == null) return null;
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "결제 정보가 존재하지 않습니다."));
    }

    // 최신 등록 상품 1개 조회
    public ProductDto getLatestProduct() {
        Product latestProduct = productRepository.findTopByProductStatusOrderByCreatedAtDesc(ProductStatus.ACTIVE);
        if (latestProduct == null) {
            return null; // 혹은 예외 처리
        }

        // 이미지가 비어있으면 log로 확인
        if (latestProduct.getImages() == null || latestProduct.getImages().isEmpty()) {
            System.out.println("배너용 최신 상품 이미지가 없음! productId=" + latestProduct.getProductId());
        }

        return ProductDto.fromEntity(latestProduct);
    }

    // 종료 임박 상품 조회
    public ProductDto getEndingSoonProduct() {
        Product product = productRepository
                .findTopByProductStatusAndAuctionEndTimeAfterOrderByAuctionEndTimeAsc(
                        ProductStatus.ACTIVE, LocalDateTime.now()
                );
        if (product == null) {
            return null; // 혹은 예외 처리
        }

        if (product.getImages() == null || product.getImages().isEmpty()) {
            System.out.println("배너용 종료 임박 상품 이미지가 없음! productId=" + product.getProductId());
        }

        return ProductDto.fromEntity(product);
    }

    public Page<ProductDto> searchProductsPaged(String keyword, ProductCategoryType categoryType, ProductStatus status, Pageable pageable) {
        Page<Product> products;

        boolean hasKeyword = keyword != null && !keyword.isEmpty();
        boolean hasCategory = categoryType != null;
        boolean hasStatus = status != null;

        if (hasKeyword && hasCategory && hasStatus) {
            products = productRepository.findByTitleContainingAndProductCategoryTypeAndProductStatus(
                    keyword, categoryType, status, pageable);
        } else if (hasKeyword && hasCategory) {
            products = productRepository.findByTitleContainingAndProductCategoryType(
                    keyword, categoryType, pageable);
        } else if (hasKeyword && hasStatus) {
            products = productRepository.findByTitleContainingAndProductStatus(
                    keyword, status, pageable);
        } else if (hasCategory && hasStatus) {
            products = productRepository.findByProductCategoryTypeAndProductStatus(
                    categoryType, status, pageable);
        } else if (hasKeyword) {
            products = productRepository.findByTitleContaining(keyword, pageable);
        } else if (hasCategory) {
            products = productRepository.findByProductCategoryType(categoryType, pageable);
        } else if (hasStatus) {
            products = productRepository.findByProductStatus(status, pageable);
        } else {
            products = productRepository.findAll(pageable);
        }

        return products.map(ProductDto::fromEntity);
    }

    // 로그인한 사용자의 구매 완료 상품 목록 조회
    public List<ProductDto> getPurchasedProducts(Long userId) {
        List<Product> products = productRepository.findByPaymentUserIdAndPaymentStatus(userId, PaymentStatus.PAID);

        return products.stream()
                .map(ProductDto::fromEntity)
                .collect(Collectors.toList());
    }
}