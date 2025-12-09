package com.my.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.my.backend.dto.BidDto;
import com.my.backend.dto.ImageDto;
import com.my.backend.dto.ProductDto;
import com.my.backend.entity.Bid;
import com.my.backend.entity.Image;
import com.my.backend.entity.Payment;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import com.my.backend.enums.ImageType;
import com.my.backend.enums.PaymentStatus;
import com.my.backend.enums.ProductCategoryType;
import com.my.backend.enums.ProductStatus;
import com.my.backend.repository.BidRepository;
import com.my.backend.repository.BookMarkRepository;
import com.my.backend.repository.ImageRepository;
import com.my.backend.repository.PaymentRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.UserRepository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final BookMarkRepository bookMarkRepository;
    private final ImageRepository imageRepository;
    private final EntityManager em;

    // ========================================
    // 🔹 헬퍼 메서드: Product → ProductDto 변환 + 이미지 추가
    // ========================================
    public ProductDto convertToDto(Product product) {
        ProductDto dto = ProductDto.fromEntity(product);

        // 이미지 조회 및 추가
        List<ImageDto> images = imageRepository
                .findByRefIdAndImageType(product.getProductId(), ImageType.PRODUCT)
                .stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
        dto.setImages(images);

        return dto;
    }

    // 북마크 여부 업데이트 헬퍼
    private void updateBookmarkStatus(List<ProductDto> products, Long userId) {
        if (userId == null) return;
        for (ProductDto dto : products) {
            boolean isBookmarked = bookMarkRepository.existsByUserUserIdAndProductProductId(userId, dto.getProductId());
            dto.setBookmarked(isBookmarked);
        }
    }

    // 전체 상품 조회
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 이미지 조회 (기존 헬퍼 - 삭제 가능)
    private List<Image> getProductImages(Long productId) {
        return imageRepository.findByRefIdAndImageType(productId, ImageType.PRODUCT);
    }

    // 특정 사용자의 판매 상품 조회
    public List<ProductDto> getProductsBySeller(Long sellerId) {
        Users seller = findUserOrThrow(sellerId);
        return productRepository.findBySeller(seller)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 상품 생성
    public ProductDto createProduct(ProductDto dto) {
        Users seller = findUserOrThrow(dto.getSellerId());
        Bid bid = findBidOrNull(dto.getBidId());
        Payment payment = findPaymentOrNull(dto.getPaymentId());

        Product product = dto.toEntity(seller, bid, payment);

        // 상품 저장
        Product saved = productRepository.save(product);

        // 이미지가 있으면 DTO → Entity 변환 후 저장 (refId + ImageType 기반)
        if (dto.getImages() != null && !dto.getImages().isEmpty()) {
            List<Image> images = dto.getImages().stream()
                    .map(imageDto -> {
                        Image image = imageDto.toEntity();
                        image.setRefId(saved.getProductId());
                        image.setImageType(ImageType.PRODUCT);
                        return image;
                    })
                    .toList();

            imageRepository.saveAll(images);
        }

        return convertToDto(saved);
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

        // DTO → Entity 매핑
        mapDtoToProduct(product, dto, seller, bid, payment);

        // 이미지 업데이트
        if (dto.getImages() != null) {
            // 기존 이미지 삭제
            List<Image> existingImages = imageRepository.findByRefIdAndImageType(
                    product.getProductId(),
                    ImageType.PRODUCT
            );
            if (!existingImages.isEmpty()) {
                imageRepository.deleteAll(existingImages);
            }

            // 새로운 이미지 저장
            List<Image> newImages = dto.getImages().stream()
                    .map(imageDto -> {
                        Image image = imageDto.toEntity();
                        image.setRefId(product.getProductId());
                        image.setImageType(ImageType.PRODUCT);
                        return image;
                    })
                    .toList();

            imageRepository.saveAll(newImages);
        }

        Product saved = productRepository.save(product);
        return convertToDto(saved);
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
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "상품을 찾을 수 없습니다."));
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용자를 찾을 수 없습니다."));

        Long highestBid = bidRepository.findTopByProductOrderByBidPriceDesc(product)
                .map(Bid::getBidPrice)
                .orElse(product.getStartingPrice() != null ? product.getStartingPrice() : 0L);

        if (price <= highestBid) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "입찰 금액은 현재 최고 입찰가보다 높아야 합니다.");
        }

        Bid bid = Bid.builder()
                .user(user)
                .bidPrice(price)
                .isWinning(true)
                .product(product)
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

    // 일반 검색 (기존 유지)
    public List<ProductDto> searchProducts(String keyword, ProductCategoryType categoryType, ProductStatus status) {
        return searchProducts(keyword, categoryType, status, null, null, null, null);
    }

    // 일반 검색 (가격 필터 추가)
    public List<ProductDto> searchProducts(
            String keyword, ProductCategoryType categoryType, ProductStatus status,
            Long minPrice, Long maxPrice,
            Long minStartPrice, Long maxStartPrice
    ) {
        Specification<Product> spec = ProductRepository.createSpecification(
                keyword, categoryType, status,
                minPrice, maxPrice,
                minStartPrice, maxStartPrice
        );

        // Sort by createdAt desc by default for non-paged search, similar to existing logic
        return productRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 일반 검색 (UserId 포함)
    public List<ProductDto> searchProducts(
            String keyword, ProductCategoryType categoryType, ProductStatus status,
            Long minPrice, Long maxPrice,
            Long minStartPrice, Long maxStartPrice,
            Long userId
    ) {
        List<ProductDto> products = searchProducts(
                keyword, categoryType, status,
                minPrice, maxPrice,
                minStartPrice, maxStartPrice
        );
        updateBookmarkStatus(products, userId);
        return products;
    }

    // 최신 등록 상품 1개 조회
    public ProductDto getLatestProduct() {
        Product latestProduct = productRepository.findTopByProductStatusOrderByCreatedAtDesc(ProductStatus.ACTIVE);
        if (latestProduct == null) return null;
        return convertToDto(latestProduct);
    }

    // 종료 임박 상품 조회
    public ProductDto getEndingSoonProduct() {
        Product endingProduct = productRepository
                .findTopByProductStatusAndAuctionEndTimeAfterOrderByAuctionEndTimeAsc(
                        ProductStatus.ACTIVE, LocalDateTime.now()
                );
        if (endingProduct == null) return null;
        return convertToDto(endingProduct);
    }

    // 페이징 검색 (기존 유지)
    public Page<ProductDto> searchProductsPaged(String keyword, ProductCategoryType categoryType, ProductStatus status, Pageable pageable) {
        return searchProductsPaged(keyword, categoryType, status, null, null, null, null, pageable);
    }

    // 페이징 검색 (가격 필터 추가)
    public Page<ProductDto> searchProductsPaged(
            String keyword, ProductCategoryType categoryType, ProductStatus status,
            Long minPrice, Long maxPrice,
            Long minStartPrice, Long maxStartPrice,
            Pageable pageable) {

        Specification<Product> spec = ProductRepository.createSpecification(
                keyword, categoryType, status,
                minPrice, maxPrice,
                minStartPrice, maxStartPrice
        );

        return productRepository.findAll(spec, pageable).map(this::convertToDto);
    }

    // 페이징 검색 (UserId 포함)
    public Page<ProductDto> searchProductsPaged(
            String keyword, ProductCategoryType categoryType, ProductStatus status,
            Long minPrice, Long maxPrice,
            Long minStartPrice, Long maxStartPrice,
            Pageable pageable, Long userId) {

        Page<ProductDto> page = searchProductsPaged(
                keyword, categoryType, status,
                minPrice, maxPrice,
                minStartPrice, maxStartPrice,
                pageable
        );
        
        updateBookmarkStatus(page.getContent(), userId);
        return page;
    }

    // 로그인한 사용자의 구매 완료 상품 목록 조회
    public List<ProductDto> getPurchasedProducts(Long userId) {
        List<Product> products = productRepository.findByPaymentUserUserIdAndPaymentStatus(userId, PaymentStatus.PAID);

        return products.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // ========================================
    // 내부 헬퍼 메서드
    // ========================================
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

    private void mapDtoToProduct(Product product, ProductDto dto, Users seller, Bid bid, Payment payment) {
        product.setTitle(dto.getTitle());
        product.setContent(dto.getContent());
        product.setTag(dto.getTag());
        product.setStartingPrice(dto.getStartingPrice());
        product.setOriginalPrice(dto.getOriginalPrice());
        product.setSalePrice(dto.getSalePrice());
        product.setDiscountRate(dto.getDiscountRate());
        product.setAuctionEndTime(dto.getAuctionEndTime());
        product.setDeliveryIncluded(dto.isDeliveryIncluded());
        product.setDeliveryPrice(dto.getDeliveryPrice());
        product.setDeliveryAddPrice(dto.getDeliveryAddPrice());
        product.setProductType(dto.getProductType());
        product.setProductStatus(dto.getProductStatus());
        product.setPaymentStatus(dto.getPaymentStatus());
        product.setDeliveryType(dto.getDeliveryType());
        product.setProductCategoryType(dto.getProductCategoryType());
        product.setSeller(seller);
        product.setBid(bid);
        product.setPayment(payment);
    }
    @Transactional
    public ProductDto getProduct(Long productId) {

        // 🔥 동시성 안전하게 증가
        productRepository.incrementViewCount(productId);

        // 증가시킨 뒤 엔티티 다시 조회
        Product product = findProductOrThrow(productId);
        return convertToDto(product);
    }
    //랭킹
    public List<ProductDto> getRank(String category) {

        Pageable limit = PageRequest.of(0, 100);

        List<Product> products;

        if (category == null) {
            products = productRepository.findTopByViewCount(limit);
        } else {
            products = productRepository.findTopByCategoryAndViewCount(
                    ProductCategoryType.valueOf(category.toUpperCase()),
                    limit
            );
        }

        return products.stream()
                .map(this::convertToDto)
                .toList();
    }


}