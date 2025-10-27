package com.my.backend.controller;

import com.my.backend.dto.UserDto;
import com.my.backend.entity.User;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.repository.UserRepository;
import com.my.backend.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // 로그인 (JWT 발급)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserDto dto) {
        if (dto.getEmail() == null || dto.getPassword() == null) {
            return ResponseEntity.badRequest().body("이메일과 비밀번호를 모두 입력해야 합니다.");
        }

        UserDto userDto = userService.login(dto.getEmail(), dto.getPassword());
        String token = jwtUtil.createJwt(userDto.getUserId(), userDto.getEmail(), userDto.getRole().name(), JWT_EXPIRATION_MS);

        return ResponseEntity.ok()
                .header("Authorization", "Bearer " + token)
                .body(userDto);
    }

    // 로그인 상태 확인 (새로고침 후 유지용) (JWT 기반)
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        String token = authHeader.replace("Bearer ", "");
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).build();
        }
        String email = jwtUtil.getEmail(token); // 토큰에서 이메일 추출
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        return ResponseEntity.ok(UserDto.fromEntity(user));
    }

    // 마이페이지 조회 (로그인한 유저 기준) (JWT 기반)
    @GetMapping("/{id}/mypage")
    public UserDto getMyPage(@PathVariable Long id, HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        if (!id.equals(sessionUserId)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        return userService.getUser(id);
    }

    // 마이페이지 업데이트
    @PutMapping("/{id}/mypage")
    public UserDto updateMyPage(@PathVariable Long id, @RequestBody UserDto dto, HttpSession session) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        if (!id.equals(sessionUserId)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        dto.setUserId(id); // PathVariable id를 DTO에 설정
        return userService.updateUser(dto);
    }

    // 유저 삭제
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    // 로그아웃
    @PostMapping("/logout")
    public void logout(HttpSession session) {
        session.invalidate();
    }

//    // 마이페이지 조회 (JWT 기반)
//    @GetMapping("/mypage")
//    public ResponseEntity<UserDto> getMyPage(@RequestHeader("Authorization") String authHeader) {
//        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//            return ResponseEntity.status(401).build();
//        }
//
//        String token = authHeader.replace("Bearer ", "");
//        if (!jwtUtil.validateToken(token)) {
//            return ResponseEntity.status(401).build();
//        }
//
//        String email = jwtUtil.getEmail(token);
//        User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
//
//        return ResponseEntity.ok(UserDto.fromEntity(user));
//    }
//
//    // 마이페이지 업데이트 (JWT 기반)
//    @PutMapping("/mypage")
//    public ResponseEntity<UserDto> updateMyPage(@RequestHeader("Authorization") String authHeader,
//                                                @RequestBody UserDto dto) {
//        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//            return ResponseEntity.status(401).build();
//        }
//
//        String token = authHeader.replace("Bearer ", "");
//        if (!jwtUtil.validateToken(token)) {
//            return ResponseEntity.status(401).build();
//        }
//
//        String email = jwtUtil.getEmail(token);
//        User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
//
//        dto.setUserId(user.getUserId());
//        UserDto updated = userService.updateUser(dto);
//
//        return ResponseEntity.ok(updated);
//    }
//
//    // 유저 삭제 (관리자용)
//    @DeleteMapping("/{id}")
//    public void deleteUser(@PathVariable Long id) {
//        userService.deleteUser(id);
//    }
}