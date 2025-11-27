package com.my.backend.config;

import com.my.backend.entity.Users;
import com.my.backend.enums.Role;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        // --- 관리자 계정 초기화 ---
        if (userRepository.findByEmail("admin@example.com").isEmpty()) {
            Users admin = Users.builder()
                    .userName("관리자")
                    .nickName("admin")
                    .email("admin@example.com")
                    .password(passwordEncoder.encode("Admin1234!"))
                    .phone("01000000000")
                    .role(Role.ADMIN)
                    .birthday(LocalDate.of(1990, 1, 1))
                    .createdAt(LocalDateTime.now())
                    .build();

            userRepository.save(admin);
            System.out.println("✅ 관리자 계정 생성 완료!");
        } else {
            System.out.println("⚠️ 관리자 계정이 이미 존재합니다.");
        }
    }
}