package com.my.backend.service;

import com.my.backend.common.enums.ProductStatus;
import com.my.backend.config.FileUploadConfig;
import com.my.backend.dto.ProductDto;
import com.my.backend.dto.BidDto;
import com.my.backend.dto.ImageDto;
import com.my.backend.entity.*;
import com.my.backend.repository.*;
import jakarta.persistence.EntityManager;
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
    private final FileUploadConfig fileUploadConfig; // @RequiredArgsConstructor 덕분에 주입됨
    private final EntityManager em;


    //  전체 상품 조회 - 이미지 리스트 포함
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(product -> {
                    ProductDto dto = ProductDto.fromEntity(product);
                    // 이미지 리스트 추가
                    List<ImageDto> images = imageRepository.findByProduct_ProductId(product.getProductId())
                            .stream()
                            .map(ImageDto::fromEntity)
                            .collect(Collectors.toList());
                    dto.setImages(images);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    //  단일 상품 조회 - 이미지 리스트 포함
    public ProductDto getProduct(Long id) {
        Product product = findProductOrThrow(id);
        ProductDto dto = ProductDto.fromEntity(product);

        // 이미지 리스트 추가
        List<ImageDto> images = imageRepository.findByProduct_ProductId(id)
                .stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
        dto.setImages(images);

        return dto;
    }

    //  특정 사용자의 판매 상품 조회 - 이미지 리스트 포함
    public List<ProductDto> getProductsBySeller(Long userId) {
        return productRepository.findByUserUserId(userId)
                .stream()
                .map(product -> {
                    ProductDto dto = ProductDto.fromEntity(product);
                    // 이미지 리스트 추가
                    List<ImageDto> images = imageRepository.findByProduct_ProductId(product.getProductId())
                            .stream()
                            .map(ImageDto::fromEntity)
                            .collect(Collectors.toList());
                    dto.setImages(images);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // 상품 생성
    public ProductDto createProduct(ProductDto dto) {
        User seller = findUserOrThrow(dto.getSellerId());
        Category category = findCategoryOrThrow(dto.getCategoryId());
        Bid bid = findBidOrNull(dto.getBidId());
        Payment payment = findPaymentOrNull(dto.getPaymentId());
        Image image = findImageOrNull(dto.getImageId());

        // ⚠️ 단일 이미지를 List로 감싸 실제 엔티티에 반영
        List<Image> imageEntities = (image != null) ? List.of(image) : null;

        Product product = dto.toEntity(seller, bid, payment, category);
        product.setImages(imageEntities);

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
        // 단일 이미지 설정
        product.setImages(image != null ? List.of(image) : null);
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

    // 상품 검색 - 이미지 리스트 포함
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
                .map(product -> {
                    ProductDto dto = ProductDto.fromEntity(product);
                    // 이미지 리스트 추가
                    List<ImageDto> images = imageRepository.findByProduct_ProductId(product.getProductId())
                            .stream()
                            .map(ImageDto::fromEntity)
                            .collect(Collectors.toList());
                    dto.setImages(images);
                    return dto;
                })
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
    }

<<<<<<< HEAD
    // 최신 등록 상품 1개 조회 - 이미지 리스트 포함
    public ProductDto getLatestProduct() {
        Product latestProduct = productRepository.findTopByProductStatusOrderByCreatedAtDesc(ProductStatus.ACTIVE);
        if (latestProduct == null) {
            return null; // 필요시 예외 처리로 변경 가능
        }

        ProductDto dto = ProductDto.fromEntity(latestProduct);
        // 이미지 리스트 추가 (엔티티의 images가 비어있을 수 있어 리포지토리로 보강)
        List<ImageDto> images = imageRepository.findByProduct_ProductId(latestProduct.getProductId())
                .stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
        dto.setImages(images);
=======
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

        if (latestProduct == null) return null;

        // 이미지 없는 경우 빈 리스트로 초기화
        if (latestProduct.getImages() == null) {
            latestProduct.setImages(List.of());
        }
>>>>>>> d93fef2 (배너 출력수정)

        return dto;
    }

    // 종료(마감) 임박 상품 조회 - 이미지 리스트 포함
    public ProductDto getEndingSoonProduct() {
<<<<<<< HEAD
        Product product = productRepository
                .findTopByProductStatusAndAuctionEndTimeAfterOrderByAuctionEndTimeAsc(
                        ProductStatus.ACTIVE, LocalDateTime.now()
                );

        if (product == null) {
            return null; // 필요시 예외 처리로 변경 가능
        }

        ProductDto dto = ProductDto.fromEntity(product);
        List<ImageDto> images = imageRepository.findByProduct_ProductId(product.getProductId())
                .stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
        dto.setImages(images);

        return dto;
=======
        Product endingProduct = productRepository.findTopByProductStatusAndAuctionEndTimeAfterOrderByAuctionEndTimeAsc(
                ProductStatus.ACTIVE, LocalDateTime.now());

        if (endingProduct == null) return null;

        if (endingProduct.getImages() == null) {
            endingProduct.setImages(List.of());
        }

        return ProductDto.fromEntity(endingProduct);
>>>>>>> d93fef2 (배너 출력수정)
    }

    // 페이지네이션 검색 - 이미지 리스트 포함
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

        return products.map(product -> {
            ProductDto dto = ProductDto.fromEntity(product);
            // 이미지 리스트 추가
            List<ImageDto> images = imageRepository.findByProduct_ProductId(product.getProductId())
                    .stream()
                    .map(ImageDto::fromEntity)
                    .collect(Collectors.toList());
            dto.setImages(images);
            return dto;
        });
    }

    // 다중 이미지와 함께 상품 생성 - 이미지 리스트 포함하여 반환
    @Transactional
    public ProductDto createProductWithImages(ProductDto dto, MultipartFile[] files) {

        //  카테고리 유효성 검증 추가
        if (dto.getCategoryId() == null || dto.getCategoryId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "카테고리를 반드시 선택해야 합니다.");
        }

        User seller = findUserOrThrow(dto.getSellerId());
        Category category = findCategoryOrThrow(dto.getCategoryId());
        Bid bid = findBidOrNull(dto.getBidId());
        Payment payment = findPaymentOrNull(dto.getPaymentId());

        // Product 생성
        Product product = dto.toEntity(seller, bid, payment, category);

        // 이미지 처리 및 추가
        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                try {
                    String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
                    Path path = Paths.get(fileUploadConfig.getUploadDir()).resolve(filename).toAbsolutePath();
                    Files.createDirectories(path.getParent());
                    file.transferTo(path.toFile());

                    Image image = Image.builder()
                            .imagePath("/uploads/" + filename)
                            .build();

                    product.addImage(image);  // 양방향 관계 설정
                } catch (Exception e) {
                    throw new RuntimeException("이미지 저장 실패", e);
                }
            }
        }

        // Product 저장 (CascadeType.ALL 설정 시 이미지도 함께 저장)
        Product savedProduct = productRepository.save(product);

        // 이미지 리스트 포함하여 반환
        ProductDto resultDto = ProductDto.fromEntity(savedProduct);
        List<ImageDto> images = imageRepository.findByProduct_ProductId(savedProduct.getProductId())
                .stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
        resultDto.setImages(images);

        return resultDto;
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
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "카테고리를 반드시 선택해야 합니다.");
        }
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 카테고리가 존재하지 않습니다."));
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
}
