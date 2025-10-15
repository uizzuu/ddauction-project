package com.my.backend.controller;

import com.my.backend.dto.SigninRequest;
import com.my.backend.dto.SignupRequest;
import com.my.backend.dto.UserDto;
import com.my.backend.entity.User;
import com.my.auction.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public UserDto signup(@RequestBody SignupRequest request) {
        User user = authService.signup(
                request.getUserName(),
                request.getNickName(),
                request.getEmail(),
                request.getPassword(),
                request.getPhone()
        );
        return UserDto.fromEntity(user);
    }

    @PostMapping("/signin")
    public UserDto signin(@RequestBody SigninRequest request) {
        User user = authService.signin(request.getEmail(), request.getPassword());
        return UserDto.fromEntity(user);
    }
}
