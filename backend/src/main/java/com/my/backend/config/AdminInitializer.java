package com.my.backend.config;

import com.my.backend.entity.User;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 이미 ADMIN 계정이 있는지 체크
        if(userRepository.findByEmail("admin@example.com").isEmpty()) {
            User admin = User.builder()
                    .userName("관리자")
                    .nickName("admin")
                    .email("admin@example.com")
                    .password(passwordEncoder.encode("admin123"))
                    .phone("01000000000")
                    .role(User.Role.ADMIN)
                    .build();

            userRepository.save(admin);
            System.out.println("관리자 계정 생성 완료!");
        }
    }
}
