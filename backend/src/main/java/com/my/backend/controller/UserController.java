package com.my.backend.controller;

import com.my.backend.dto.UserDto;
import com.my.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 모든 유저 조회 (id 필요 없으므로 그대로 GET)
    @GetMapping
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers();
    }

    // 단일 유저 조회 (GET이므로 pathvariable 유지)
    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.getUser(id);
    }

    // 유저 생성
    @PostMapping
    public UserDto createUser(@RequestBody UserDto dto) {
        return userService.createUser(dto);
    }

    // 유저 수정: DTO에서 id 가져오기
    @PutMapping
    public UserDto updateUser(@RequestBody UserDto dto) {
        return userService.updateUser(dto);
    }

    // 유저 삭제: DTO에서 id 가져오기
    @DeleteMapping
    public void deleteUser(@RequestBody UserDto dto) {
        userService.deleteUser(dto.getUserId());
    }

    // 마이페이지 업데이트: DTO에서 id 가져오기
    @PutMapping("/mypage")
    public UserDto updateMyPage(@RequestBody UserDto dto) {
        return userService.updateUser(dto);
    }

    // 마이페이지 조회는 GET이므로 pathvariable 유지
    @GetMapping("/{id}/mypage")
    public UserDto getMyPage(@PathVariable Long id) {
        return userService.getUser(id);
    }
}
