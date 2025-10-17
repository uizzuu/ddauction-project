package com.my.backend.controller;

import com.my.backend.dto.UserUpdateDto;
import com.my.backend.entity.User;
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
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.getUser(id);
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        return userService.updateUser(id, user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    @PutMapping("/{id}/mypage")
    public User updateMyPage(
            @PathVariable Long id,
            @RequestBody UserUpdateDto dto
    ) {
        return userService.updateUserInfo(id, dto);
    }

    @GetMapping("/{id}/mypage")
    public User getMyPage(@PathVariable Long id) {
        return userService.getUser(id);
    }

}
