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

    // 모든 유저 조회 (관리자용)
    @GetMapping
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers();
    }

    // 단일 유저 조회 (관리자용)
    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.getUser(id);
    }

    // 회원가입
    @PostMapping("/signup")
    public UserDto createUser(@Valid @RequestBody UserDto dto) {
        System.out.println("received password: '" + dto.getPassword() + "'");
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

    // 마이페이지 조회 (로그인한 유저 기준)
    @GetMapping("/{id}/mypage")
    public UserDto getMyPage(@PathVariable Long id) {
        return userService.getUser(id);
    }

    // 마이페이지 업데이트
    @PutMapping("/{id}/mypage")
    public UserDto updateMyPage(@PathVariable Long id, @RequestBody UserDto dto) {
        dto.setUserId(id); // PathVariable id를 DTO에 설정
        return userService.updateUser(dto);
    }

    // 유저 삭제
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}