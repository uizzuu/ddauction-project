package com.my.backend.service;

import com.my.backend.entity.User;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // 회원가입
    public User signup(String userName, String nickName, String email, String password, String phone) {
        checkDuplicateEmail(email);
        checkDuplicateNickName(nickName);

        return userRepository.save(
                User.builder()
                        .userName(userName)
                        .nickName(nickName)
                        .email(email)
                        .password(passwordEncoder.encode(password))
                        .phone(phone)
                        .role(User.Role.USER)
                        .build()
        );
    }

    // 로그인
    public User signin(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("가입되지 않은 이메일입니다."));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }

        return user;
    }

    // 이메일 중복 체크
    private void checkDuplicateEmail(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        }
    }

    // 닉네임 중복 체크
    private void checkDuplicateNickName(String nickName) {
        if (userRepository.existsByNickName(nickName)) {
            throw new RuntimeException("이미 존재하는 닉네임입니다.");
        }
    }
}
