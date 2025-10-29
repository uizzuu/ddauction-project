package com.my.backend.config;

import com.my.backend.entity.Category;
import com.my.backend.entity.User;
import com.my.backend.repository.CategoryRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CategoryRepository categoryRepository;

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
    }
}
