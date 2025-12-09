package com.my.backend.controller;

import com.my.backend.dto.UsersDto;
import com.my.backend.dto.auth.LoginRequest;
import com.my.backend.dto.auth.RegisterRequest;
import com.my.backend.entity.Users;
import com.my.backend.enums.Role;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.repository.UserRepository;
import com.my.backend.service.AuthService;
import com.my.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final JWTUtil jwtUtil;

    private final Long JWT_EXPIRATION_MS = 1000L * 60 * 60 * 24;

    // 모든 유저 조회 (관리자용)
    @GetMapping
    public List<UsersDto> getAllUsers(@RequestHeader("Authorization") String authHeader) {
        checkAdminRole(authHeader);
        return userService.getAllUsers();
    }

    // 단일 유저 조회 (관리자용)
    @GetMapping("/{id}")
    public UsersDto getUser(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        checkAdminRole(authHeader);
        return userService.getUser(id);
    }

    //  현재 로그인한 사용자 정보 조회
    @GetMapping("/me")
    public ResponseEntity<UsersDto> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        Users user = getUserFromToken(authHeader);
        return ResponseEntity.ok(UsersDto.fromEntity(user));
    }

    // 마이페이지 조회 (JWT 기반)
    @GetMapping("/{id}/mypage")
    public ResponseEntity<UsersDto> getMyPage(@PathVariable Long id,
                                              @RequestHeader("Authorization") String authHeader) {
        Users user = getUserFromToken(authHeader);
        if (!id.equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 계정만 접근 가능합니다.");
        }
        UsersDto userDto = userService.getUser(id);
        return ResponseEntity.ok(userDto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsersDto> updateUserProfile(@PathVariable Long id,
                                                      @RequestBody UsersDto dto,
                                                      @RequestHeader("Authorization") String authHeader) {
        Users user = getUserFromToken(authHeader);

        if (!id.equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 계정만 수정 가능합니다.");
        }
        dto.setUserId(id);
        UsersDto updated = userService.updateUser(dto);
        return ResponseEntity.ok(updated);
    }

    // 마이페이지 업데이트
    @PutMapping("/{id}/mypage")
    public ResponseEntity<UsersDto> updateMyPage(@PathVariable Long id,
                                                 @RequestBody UsersDto dto,
                                                 @RequestHeader("Authorization") String authHeader) {

        Users user = getUserFromToken(authHeader);
        if (!id.equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 계정만 수정 가능합니다.");
        }
        dto.setUserId(id);
        UsersDto updated = userService.updateUser(dto);
        return ResponseEntity.ok(updated);
    }

    // 유저 삭제 (관리자용)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id,
                                        @RequestHeader("Authorization") String authHeader) {
        checkAdminRole(authHeader);
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "유저 삭제 완료"));
    }

    // 관리자용 회원 정보 수정
    @PutMapping("/{id}/admin")
    public ResponseEntity<UsersDto> updateUserByAdmin(@PathVariable Long id,
                                                      @RequestBody UsersDto dto,
                                                      @RequestHeader("Authorization") String authHeader) {
        checkAdminRole(authHeader);

        dto.setUserId(id);
        UsersDto updated = userService.updateUser(dto);
        return ResponseEntity.ok(updated);
    }

    // 회원 탈퇴 (본인)
    @DeleteMapping("/{id}/withdraw")
    public ResponseEntity<?> deleteMyAccount(@PathVariable Long id,
                                             @RequestHeader("Authorization") String authHeader) {
        Users user = getUserFromToken(authHeader);
        if (!id.equals(user.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 계정만 탈퇴 가능합니다.");
        }

        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "회원 탈퇴 완료"));
    }

    // 공통 메서드
    // JWT 검증 및 사용자 조회
    private Users getUserFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }

        String token = authHeader.replace("Bearer ", "");
        if (!jwtUtil.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰이 유효하지 않습니다.");
        }

        return userRepository.findByEmail(jwtUtil.getEmail(token))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    // JWT 검증 + 관리자 권한 확인
    private void checkAdminRole(String authHeader) {
        Users user = getUserFromToken(authHeader);
        if (!"ADMIN".equals(user.getRole().name())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.");
        }
    }
}