package com.my.backend.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;


import com.my.backend.enums.*;
import com.my.backend.repository.*;
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
import com.my.backend.entity.ProductViewLog;
import com.my.backend.entity.Users;
import com.my.backend.enums.Role;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
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
    private final ProductViewLogRepository productViewLogRepository;
    private final ReviewRepository reviewRepository;

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

        // 판매자 프로필 이미지 조회 및 추가
        if (product.getSeller() != null) {
            List<Image> profileImages = imageRepository.findByRefIdAndImageType(
                    product.getSeller().getUserId(),
                    ImageType.USER
            );
            if (!profileImages.isEmpty()) {
                dto.setSellerProfileImage(profileImages.get(0).getImagePath());
            }
        }

        if (product.getProductType() == ProductType.AUCTION) {
            List<Bid> bids = bidRepository.findByProductOrderByBidPriceDesc(product);

            // BidDto 리스트로 변환
            List<BidDto> bidDtos = bids.stream()
                    .map(BidDto::fromEntity)
                    .collect(Collectors.toList());
            dto.setBids(bidDtos);

            // 입찰 건수
            dto.setBidCount(bids.size());

            // 최고 입찰가 (입찰이 없으면 시작가)
            Long highestBid = bids.stream()
                    .map(Bid::getBidPrice)
                    .max(Comparator.naturalOrder())
                    .orElse(product.getStartingPrice() != null ? product.getStartingPrice() : 0L);
            dto.setHighestBidPrice(highestBid);
        }

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
    public ProductDto createProduct(ProductDto dto, Long authenticatedUserId) { // 👈 시그니처 변경

        // 1️⃣ [추가] 보안 검증: DTO의 sellerId와 현재 인증된 사용자 ID가 일치하는지 확인
        if (!dto.getSellerId().equals(authenticatedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "상품 등록은 본인 계정으로만 가능합니다.");
        }

        Users seller = findUserOrThrow(dto.getSellerId());

        // 2️⃣ [기존] 사업자만 STORE 상품 등록 가능 로직 (유지)
        if (dto.getProductType() == ProductType.STORE
                && (seller.getBusinessNumber() == null || seller.getBusinessNumber().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "사업자만 일반판매(STORE) 상품을 등록할 수 있습니다.");
        }

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
    public ProductDto updateProduct(Long id, ProductDto dto, Long authenticatedUserId) {
        Product product = findProductOrThrow(id);
        Users user = findUserOrThrow(authenticatedUserId); // 현재 로그인된 사용자 (관리자)

        // ⭐⭐ 수정: DTO의 sellerId 대신 기존 상품의 판매자 엔티티를 사용 ⭐⭐
        // 상품 수정 시 판매자 정보는 바뀌지 않으므로, 기존 상품의 판매자 정보를 가져옵니다.
        Users seller = product.getSeller(); // 기존 상품의 판매자 엔티티를 사용

        // DTO에 새로운 판매자 ID가 있다면 (매우 특수한 경우)
        if (dto.getSellerId() != null && !dto.getSellerId().equals(seller.getUserId())) {
            // 관리자가 판매자를 변경하는 경우 등, 필요한 로직을 추가하거나
            // 이 로직을 통해 seller 객체를 새로 찾도록 할 수 있습니다.
            // 현재는 기존 판매자를 유지한다고 가정합니다.
        }

        // 2️⃣ [수정]: 소유자 검증 OR 관리자 검증 (이 로직은 유지)
        boolean isAdmin = user.getRole() == Role.ADMIN;
        boolean isOwner = product.getSeller().getUserId().equals(authenticatedUserId);

        if (!isAdmin && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "수정 권한이 없습니다. 해당 상품의 판매자가 아닙니다.");
        }

        // 3️⃣ [기존] 사업자만 STORE 상품 수정 가능 로직 (유지)
        if (dto.getProductType() == ProductType.STORE
                && (seller.getBusinessNumber() == null || seller.getBusinessNumber().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "사업자만 일반판매(STORE) 상품을 수정할 수 있습니다.");
        }

        // ... (Bid, Payment 조회 로직은 그대로)
        Bid bid = findBidOrNull(dto.getBidId());
        Payment payment = findPaymentOrNull(dto.getPaymentId());


        // DTO → Entity 매핑
        // mapDtoToProduct 호출 시, 위에서 정의한 Users seller 변수를 전달합니다.
        mapDtoToProduct(product, dto, seller, bid, payment);

        // 이미지 업데이트
        if (dto.getImages() != null && !dto.getImages().isEmpty()) {
            // ✅ dto.getImages()가 null이 아니고 비어있지 않을 때만 이미지 업데이트

            // 1️⃣ 새로운 이미지 목록 생성
            List<Image> newImages = dto.getImages().stream()
                    .map(imageDto -> {
                        Image image = imageDto.toEntity();
                        image.setImageId(null);
                        image.setRefId(product.getProductId());
                        image.setImageType(ImageType.PRODUCT);
                        return image;
                    })
                    .toList();

            // 2️⃣ 기존 이미지 삭제
            List<Image> existingImages = imageRepository.findByRefIdAndImageType(
                    product.getProductId(),
                    ImageType.PRODUCT
            );
            if (!existingImages.isEmpty()) {
                imageRepository.deleteAll(existingImages);
            }

            // 3️⃣ 새 이미지 저장
            imageRepository.saveAll(newImages);
        }
// ✅ dto.getImages()가 null이거나 빈 배열이면 기존 이미지 유지

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

    // ==========================================================
    // 1. 조회수 증가 로직이 포함된 메서드 (컨트롤러에서 incrementView=true 일 때 호출)
    // ==========================================================
    @Transactional
    public ProductDto getProduct(Long productId, Long userId) {
        // 1️⃣ 상품 조회 (영속 상태)
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품이 존재하지 않습니다."));

        LocalDateTime now = LocalDateTime.now();

        if (userId != null) {
            // 2️⃣ 로그인 유저
            Users user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 없음"));

            // 기존 조회 로그 확인
            ProductViewLog viewLog = productViewLogRepository.findByUserAndProduct(user, product)
                    .orElse(null);

            if (viewLog == null) {
                // 🔹 처음 조회
                product.setViewCount(product.getViewCount() + 1);

                // 새 로그 생성, em.persist로 flush 타이밍 제어
                ProductViewLog newLog = ProductViewLog.builder()
                        .user(user)
                        .product(product)
                        .viewedAt(now)
                        .build();
                em.persist(newLog);
                // 강제로 flush하면 dirty checking과 충돌 방지
                em.flush();

            } else if (viewLog.getViewedAt().isBefore(now.minusHours(1))) {
                // 🔹 1시간 지난 경우만 증가
                product.setViewCount(product.getViewCount() + 1);
                viewLog.setViewedAt(now);
                em.flush(); // 변경 반영
            }
            // 1시간 안 지난 경우 아무것도 하지 않음
        } else {
            // 3️⃣ 비로그인 (Guest) - 무조건 증가
            product.setViewCount(product.getViewCount() + 1);
            em.flush();
        }

        // 트랜잭션 종료 시 product + viewLog 모두 반영
        return convertToDto(product);
    }


    // ==========================================================
    // 2. 조회수 증가 없이 단순 조회 (컨트롤러에서 incrementView=false 일 때 호출)
    // ==========================================================
    @Transactional // 읽기 전용으로 성능 최적화
    public ProductDto getProductWithoutIncrement(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "상품이 존재하지 않습니다."));
        return convertToDto(product);
    }

    // 랭킹 조회
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

        // String 필드 (null 및 빈 문자열 체크)
        if (dto.getTitle() != null && !dto.getTitle().isEmpty()) {
            product.setTitle(dto.getTitle());
        }
        if (dto.getContent() != null && !dto.getContent().isEmpty()) {
            product.setContent(dto.getContent());
        }
        if (dto.getTag() != null && !dto.getTag().isEmpty()) {
            product.setTag(dto.getTag());
        }
        if (dto.getAddress() != null && !dto.getAddress().isEmpty()) {
            product.setAddress(dto.getAddress());
        }
        if (dto.getDeliveryAvailable() != null && !dto.getDeliveryAvailable().isEmpty()) {
            product.setDeliveryAvailable(dto.getDeliveryAvailable());
        }

        // 숫자/타임스탬프 필드 (null 체크)
        if (dto.getStartingPrice() != null) product.setStartingPrice(dto.getStartingPrice());
        if (dto.getOriginalPrice() != null) product.setOriginalPrice(dto.getOriginalPrice());
        if (dto.getSalePrice() != null) product.setSalePrice(dto.getSalePrice());
        if (dto.getDiscountRate() != null) product.setDiscountRate(dto.getDiscountRate());
        if (dto.getDeliveryPrice() != null) product.setDeliveryPrice(dto.getDeliveryPrice());
        if (dto.getDeliveryAddPrice() != null) product.setDeliveryAddPrice(dto.getDeliveryAddPrice());
        if (dto.getLatitude() != null) product.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) product.setLongitude(dto.getLongitude());
        if (dto.getAuctionEndTime() != null) product.setAuctionEndTime(dto.getAuctionEndTime());

        // Enum/List 필드 (null 체크)
        if (dto.getProductType() != null) product.setProductType(dto.getProductType());
        if (dto.getProductStatus() != null) product.setProductStatus(dto.getProductStatus());
        if (dto.getPaymentStatus() != null) product.setPaymentStatus(dto.getPaymentStatus());
        if (dto.getDeliveryType() != null) product.setDeliveryType(dto.getDeliveryType());
        if (dto.getProductCategoryType() != null) product.setProductCategoryType(dto.getProductCategoryType());
        if (dto.getProductBanners() != null) product.setProductBanners(dto.getProductBanners());

        // ⭐️ Boolean 필드 (ProductDto를 Boolean 래퍼 타입으로 수정했을 경우) ⭐️
        // DTO를 수정하지 않았다면 (boolean 원시 타입이라면), 이 로직은 여전히 덮어쓰기 문제가 있습니다.
        // 하지만 일단 getDeliveryIncluded()를 사용하며 DTO가 수정되었다고 가정합니다.
        if (dto.getDeliveryIncluded() != null) {
            product.setDeliveryIncluded(dto.getDeliveryIncluded());
        }

        // 연관 엔티티 설정 (기존 값 유지)
        product.setSeller(seller);
        product.setBid(bid);
        product.setPayment(payment);
    }

    // ★ 평균 평점 4.5 이상 상품 가져오기
    public List<Product> getTopRatedProducts() {
        // 수정포인트: 평균 4.5 이상인 상품 ID 조회
        List<Long> productIds = reviewRepository.findProductIdsByAverageRating(4.5);

        if (productIds.isEmpty()) {
            return List.of();   // 수정포인트: 빈 리스트 반환
        }

        // 수정포인트: 상품 리스트 조회
        return productRepository.findByProductIdIn(productIds);
    }
}