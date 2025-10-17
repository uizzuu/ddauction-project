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

    @GetMapping
    public List<UserDto> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return userService.getUser(id);
    }

    @PostMapping
    public UserDto createUser(@RequestBody UserDto dto) {
        return userService.createUser(dto);
    }

    // PUT: PathVariable 제거, DTO에서 id 사용
    @PutMapping
    public UserDto updateUser(@RequestBody UserDto dto) {
        return userService.updateUser(dto);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    // 마이페이지 업데이트도 동일하게 DTO 사용
    @PutMapping("/mypage")
    public UserDto updateMyPage(@RequestBody UserDto dto) {
        return userService.updateUser(dto);
    }

    @GetMapping("/{id}/mypage")
    public UserDto getMyPage(@PathVariable Long id) {
        return userService.getUser(id);
    }
}
