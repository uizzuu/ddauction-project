package com.my.backend.controller;

import com.my.backend.dto.UserDto;
import com.my.backend.entity.User;
import com.my.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 모든 유저 조회
    @GetMapping
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers();
    }

    // 단일 유저 조회
    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.getUser(id);
    }

    // 회원가입
    @PostMapping
    public UserDto createUser(@Valid @RequestBody UserDto dto) {
        if (dto.getRole() == null) {
            dto.setRole(User.Role.USER);  // 기본 Role 설정
        }
        return userService.createUser(dto);
    }

    // 로그인
    @PostMapping("/login")
    public UserDto login(@RequestBody UserDto dto) {
        if (dto.getEmail() == null || dto.getPassword() == null) {
            throw new RuntimeException("이메일과 비밀번호를 모두 입력해야 합니다.");
        }
        return userService.login(dto.getEmail(), dto.getPassword());
    }

    // 유저 수정
    @PutMapping
    public UserDto updateUser(@RequestBody UserDto dto) {
        return userService.updateUser(dto);
    }

    // 유저 삭제
    @DeleteMapping
    public void deleteUser(@RequestBody UserDto dto) {
        userService.deleteUser(dto.getUserId());
    }

    // 마이페이지 업데이트
    @PutMapping("/mypage")
    public UserDto updateMyPage(@RequestBody UserDto dto) {
        return userService.updateUser(dto);
    }

    // 마이페이지 조회
    @GetMapping("/{id}/mypage")
    public UserDto getMyPage(@PathVariable Long id) {
        return userService.getUser(id);
    }
}