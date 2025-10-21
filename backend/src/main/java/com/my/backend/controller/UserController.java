package com.my.backend.controller;

import com.my.backend.dto.UserDto;
import com.my.backend.entity.User;
import com.my.backend.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // 회원가입
    @PostMapping("/signup")
    public UserDto signup(@Valid @RequestBody UserDto dto) {
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setNickName(dto.getNickName());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    // 로그인
    @PostMapping("/login")
    public UserDto login(@RequestBody UserDto dto, HttpSession session) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("비밀번호가 틀렸습니다.");
        }
        session.setAttribute("loginUser", user); // 세션 저장
        return UserDto.fromEntity(user);
    }

    // 로그아웃
    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "로그아웃 완료";
    }

    // 로그인 유저 정보
    @GetMapping("/me")
    public UserDto me(HttpSession session) {
        User user = (User) session.getAttribute("loginUser");
        if (user == null) throw new RuntimeException("로그인이 필요합니다.");
        return UserDto.fromEntity(user);
    }

    // 특정 사용자 조회 (판매자 닉네임용)
    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        return UserDto.fromEntity(user);
    }

    // 모든 유저 조회 (관리자용)
    @GetMapping
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }
}
