package com.my.backend.service;

import com.my.backend.common.enums.ProductStatus;
import com.my.backend.config.FileUploadConfig;
import com.my.backend.dto.ProductDto;
import com.my.backend.dto.BidDto;
import com.my.backend.entity.*;
import com.my.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
    private final CategoryRepository categoryRepository;
    private final PaymentRepository paymentRepository;
    private final ImageRepository imageRepository;

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
        User seller = findUserOrThrow(dto.getSellerId());
        Category category = findCategoryOrThrow(dto.getCategoryId());
        Bid bid = findBidOrNull(dto.getBidId());
        Payment payment = findPaymentOrNull(dto.getPaymentId());
        Image image = findImageOrNull(dto.getImageId());

        Product product = dto.toEntity(seller, bid, payment, category, image);
        Product saved = productRepository.save(product);

        return ProductDto.fromEntity(saved);
    }

    // 상품 수정
    public ProductDto updateProduct(Long id, ProductDto dto) {
        Product product = findProductOrThrow(id);
        Category category = findCategoryOrThrow(dto.getCategoryId());
        Bid bid = findBidOrNull(dto.getBidId());
        Payment payment = findPaymentOrNull(dto.getPaymentId());
        Image image = findImageOrNull(dto.getImageId());

        product.setTitle(dto.getTitle());
        product.setContent(dto.getContent());
        if (dto.getStartingPrice() != null) {
            product.setStartingPrice(dto.getStartingPrice());
        }
        product.setImage(image);
        product.setOneMinuteAuction(dto.isOneMinuteAuction());
        product.setAuctionEndTime(dto.getAuctionEndTime());
        product.setProductStatus(dto.getProductStatus());
        product.setBid(bid);
        product.setPayment(payment);
        product.setCategory(category);

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
        User user = findUserOrThrow(userId);

        Long highestBid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .map(Bid::getBidPrice)
                .orElse(product.getStartingPrice() != null ? product.getStartingPrice() : 0L);

        if (price <= highestBid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "입찰 금액은 현재 최고 입찰가보다 높아야 합니다.");
        }

        Bid bid = Bid.builder()
                .product(product)
                .user(user)
                .bidPrice(price)
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
    public List<ProductDto> searchProducts(String keyword, Long categoryId, ProductStatus status) {
        List<Product> products;

        boolean hasKeyword = keyword != null && !keyword.isEmpty();
        boolean hasCategory = categoryId != null;
        boolean hasStatus = status != null;

        if (hasKeyword && hasCategory && hasStatus) {
            products = productRepository.findByTitleContainingAndCategory_CategoryIdAndProductStatus(keyword, categoryId, status);
        } else if (hasKeyword && hasCategory) {
            products = productRepository.findByTitleContainingAndCategory_CategoryId(keyword, categoryId);
        } else if (hasKeyword && hasStatus) {
            products = productRepository.findByTitleContainingAndProductStatus(keyword, status);
        } else if (hasCategory && hasStatus) {
            products = productRepository.findByCategory_CategoryIdAndProductStatus(categoryId, status);
        } else if (hasKeyword) {
            products = productRepository.findByTitleContaining(keyword);
        } else if (hasCategory) {
            products = productRepository.findByCategory_CategoryId(categoryId);
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

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자가 존재하지 않습니다."));
    }

    private Category findCategoryOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "카테고리가 존재하지 않습니다."));
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

    private Image findImageOrNull(Long id) {
        if (id == null) return null;
        return imageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "이미지가 존재하지 않습니다."));
    }


    // 최신 등록 상품 1개 조회
    public ProductDto getLatestProduct() {
        Product latestProduct = productRepository.findTopByProductStatusOrderByCreatedAtDesc(ProductStatus.ACTIVE);
        return ProductDto.fromEntity(latestProduct);
    }

    public ProductDto getEndingSoonProduct() {
        Product product = productRepository
                .findTopByProductStatusAndAuctionEndTimeAfterOrderByAuctionEndTimeAsc(
                        ProductStatus.ACTIVE, LocalDateTime.now()
                );
        return ProductDto.fromEntity(product);
    }

    public Page<ProductDto> searchProductsPaged(String keyword, Long categoryId, ProductStatus status, Pageable pageable) {
        Page<Product> products;

        boolean hasKeyword = keyword != null && !keyword.isEmpty();
        boolean hasCategory = categoryId != null;
        boolean hasStatus = status != null;

        if (hasKeyword && hasCategory && hasStatus) {
            products = productRepository.findByTitleContainingAndCategory_CategoryIdAndProductStatus(
                    keyword, categoryId, status, pageable);
        } else if (hasKeyword && hasCategory) {
            products = productRepository.findByTitleContainingAndCategory_CategoryId(
                    keyword, categoryId, pageable);
        } else if (hasKeyword && hasStatus) {
            products = productRepository.findByTitleContainingAndProductStatus(
                    keyword, status, pageable);
        } else if (hasCategory && hasStatus) {
            products = productRepository.findByCategory_CategoryIdAndProductStatus(
                    categoryId, status, pageable);
        } else if (hasKeyword) {
            products = productRepository.findByTitleContaining(keyword, pageable);
        } else if (hasCategory) {
            products = productRepository.findByCategory_CategoryId(categoryId, pageable);
        } else if (hasStatus) {
            products = productRepository.findByProductStatus(status, pageable);
        } else {
            products = productRepository.findAll(pageable);
        }

        return products.map(ProductDto::fromEntity);
    }

    private final FileUploadConfig fileUploadConfig; // @RequiredArgsConstructor 덕분에 주입됨

    @Transactional
    public ProductDto createProductWithImages(ProductDto dto, MultipartFile[] files) {
        User seller = findUserOrThrow(dto.getSellerId());
        Category category = findCategoryOrThrow(dto.getCategoryId());
        Bid bid = findBidOrNull(dto.getBidId());
        Payment payment = findPaymentOrNull(dto.getPaymentId());

        String uploadDir = fileUploadConfig.getUploadDir();

        // Product 먼저 저장 (이미지 없이)
        Product product = dto.toEntity(seller, bid, payment, category, null);
        Product savedProduct = productRepository.save(product); // ID 생성됨

        // 이미지 파일 저장 + DB에 FK 연결하여 저장
        if (files != null && files.length > 0) {
            try {
                for (int i = 0; i < files.length; i++) {
                    MultipartFile file = files[i];
                    String filename = System.currentTimeMillis() + "_" + i + "_" + file.getOriginalFilename();
                    Path path = Paths.get(uploadDir).resolve(filename).toAbsolutePath();
                    Files.createDirectories(path.getParent());
                    file.transferTo(path.toFile());

                    // savedProduct와 함께 저장
                    Image image = Image.builder()
                            .imagePath("/uploads/" + filename)
                            .product(savedProduct)  // FK 연결
                            .build();
                    Image savedImage = imageRepository.save(image);

                    // 첫 번째 이미지를 대표 이미지로 설정
                    if (i == 0) {
                        savedProduct.setImage(savedImage);
                        productRepository.save(savedProduct);
                    }
                }
            } catch (Exception e) {
                throw new RuntimeException("이미지 저장 실패", e);
            }
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "최소 1개 이상의 이미지가 필요합니다");
        }

        return ProductDto.fromEntity(savedProduct);
    }

}