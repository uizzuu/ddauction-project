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

    // 유저 수정 (전체)
    @PutMapping
    public UserDto updateUser(@RequestBody UserDto dto) {
        return userService.updateUser(dto);
    }

    // 유저 삭제 (수정 필요: @DeleteMapping("/{id}"))
// 프론트엔드는 DELETE /api/users/{userId} 를 호출합니다.
    @DeleteMapping("/{id}") // 👈 수정 필요: @PathVariable을 받아야 합니다.
    public void deleteUser(@PathVariable Long id) { // 👈 DTO 대신 ID를 받도록 수정 필요
        userService.deleteUser(id);
    }

    // 마이페이지 업데이트 (수정 필요: @PutMapping("/{id}/mypage"))
// 프론트엔드는 PUT /api/users/{userId}/mypage 를 호출합니다.
    @PutMapping("/{id}/mypage") // 👈 수정 필요: {id}를 추가하고
    public UserDto updateMyPage(@PathVariable Long id, @RequestBody UserDto dto) { // 👈 @PathVariable을 받도록 변경
        dto.setUserId(id); // DTO에 ID 설정 (선택 사항)
        return userService.updateUser(dto);
    }

    // 마이페이지 조회 (현재는 정상)
    @GetMapping("/{id}/mypage")
    public UserDto getMyPage(@PathVariable Long id) {
        return userService.getUser(id);
    }
}