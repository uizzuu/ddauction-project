package com.my.backend.config;

import com.my.backend.common.enums.PaymentStatus;
import com.my.backend.common.enums.ProductStatus;
import com.my.backend.entity.Category;
import com.my.backend.entity.Image;
import com.my.backend.entity.Product;
import com.my.backend.entity.User;
import com.my.backend.entity.board.Board;
import com.my.backend.repository.CategoryRepository;
import com.my.backend.repository.ImageRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.UserRepository;
import com.my.backend.repository.board.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ImageRepository imageRepository;
    private final BoardRepository boardRepository;

    @Override
    public void run(String... args) throws Exception {

        // --- 관리자 계정 초기화 ---
        if (userRepository.findByEmail("admin@example.com").isEmpty()) {
            User admin = User.builder()
                    .userName("관리자")
                    .nickName("admin")
                    .email("admin@example.com")
                    .password(passwordEncoder.encode("Admin1234!"))
                    .phone("01000000000")
                    .role(User.Role.ADMIN)
                    .build();

            userRepository.save(admin);
            System.out.println("✅ 관리자 계정 생성 완료!");
        } else {
            System.out.println("⚠️ 관리자 계정이 이미 존재합니다.");
        }

        // --- 카테고리 초기화 ---
        if (categoryRepository.count() == 0) {
            List<String> categories = List.of(
                    "디지털기기", "생활가전", "가구/인테리어", "생활/주방", "유아동",
                    "도서", "의류", "잡화", "뷰티/미용", "스포츠레저",
                    "취미/게임/음반", "티켓/교환권", "반려동물용품", "식물", "기타 물품"
            );

            categories.forEach(name ->
                    categoryRepository.save(Category.builder().name(name).build())
            );

            System.out.println("✅ 카테고리 초기값 생성 완료!");
        }

        // --- 게시판 초기화 ---
        if (boardRepository.count() == 0) {
            Board defaultBoard = Board.builder()
                    .boardName("공지사항")
                    .build();
            boardRepository.save(defaultBoard);
            System.out.println("✅ 게시판 초기값 생성 완료!");
        } else {
            System.out.println("⚠️ 게시판이 이미 존재합니다.");
        }


        // --- 샘플 이미지 + 상품 ---
//        if (productRepository.count() == 0) {
//            try {
//                User admin = userRepository.findByEmail("admin@example.com").orElse(null);
//                Category category = categoryRepository.findByName("디지털기기").orElse(null);
//
//                if (admin != null && category != null) {
//                    // Product를 먼저 저장 (image 없이)
//                    Product sampleProduct = Product.builder()
//                            .user(admin)
//                            .title("샘플 상품 - MacBook Pro")
//                            .content("이것은 샘플 상품입니다. 실제 상품이 아닙니다.")
//                            .startingPrice(10000L)
//                            .image(null)
//                            .oneMinuteAuction(false)
//                            .auctionEndTime(LocalDateTime.now().plusDays(7))
//                            .productStatus(ProductStatus.ACTIVE)
//                            .paymentStatus(PaymentStatus.PENDING)
//                            .category(category)
//                            .build();
//                    Product savedProduct = productRepository.save(sampleProduct);
//
//                    // Product ID가 생성된 후 Image 저장 (FK 제약 만족)
//                    Image sampleImage = Image.builder()
//                            .imagePath("/uploads/sample-default.jpg")
//                            .product(savedProduct)
//                            .build();
//                    Image savedImage = imageRepository.save(sampleImage);
//
//                    // Product에 Image 연결 후 업데이트
//                    savedProduct.setImage(savedImage);
//                    productRepository.save(savedProduct);
//
//                    System.out.println("✅ 샘플 상품 생성 완료!");
//                }
//            } catch (Exception e) {
//                System.out.println("⚠️ 샘플 상품 생성 실패: " + e.getMessage());
//                e.printStackTrace();
//            }
//        }
    }
}
