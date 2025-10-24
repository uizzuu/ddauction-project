package com.my.backend.controller;

import com.my.backend.dto.UserDto;
import com.my.backend.dto.auth.LoginRequest;
import com.my.backend.entity.User;
import com.my.backend.service.AuthService;
import com.my.backend.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthService authService;

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

//    // 로그인 (세션 저장)
//    @PostMapping("/login")
//    public UserDto login(@RequestBody UserDto dto, HttpSession session) {
//        if (dto.getEmail() == null || dto.getPassword() == null) {
//            throw new RuntimeException("이메일과 비밀번호를 모두 입력해야 합니다.");
//        }
//
//        UserDto userDto = userService.login(dto.getEmail(), dto.getPassword());
//
//        // 세션에 사용자 ID 저장
//        session.setAttribute("userId", userDto.getUserId());
//
//        return userDto;
//    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        // 💡 AuthService의 로그인 메서드는 이미 JWT 토큰을 발행하고 ResponseEntity를 반환합니다.
        return authService.login(request);
    }

    // 로그인 상태 확인 (새로고침 후 유지용)
//    @GetMapping("/me")
//    public UserDto getCurrentUser(HttpSession session) {
//        Long userId = (Long) session.getAttribute("userId");
//        if (userId == null) {
//            throw new RuntimeException("로그인하지 않은 사용자입니다.");
//        }
//        return userService.getUser(userId);
//    }
    @GetMapping("/me")
    public UserDto getCurrentUser(Authentication authentication) {
        String email = authentication.getName(); // 로그인한 사용자의 이메일
        User user = userService.findByEmail(email);
        return UserDto.fromEntity(user);
    }


    // 마이페이지 조회 (로그인한 유저 기준)
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

    // 회원 정지 (role → BANNED)
    @PutMapping("/admin/{id}/ban")
    public UserDto banUser(@PathVariable Long id) {
        return userService.banUser(id);
    }

    // 회원 정지 해제 (role → USER)
    @PutMapping("/admin/{id}/unban")
    public UserDto unbanUser(@PathVariable Long id) {
        return userService.unbanUser(id);
    }

    // 이메일 or 닉네임으로 검색
    @GetMapping("/admin/search")
    public List<UserDto> searchUsers(@RequestParam(required = false) String email,
                                     @RequestParam(required = false) String nickName) {
        return userService.searchUsers(email, nickName);
    }

    @GetMapping("/admin")
    public List<UserDto> getAllUsersAdmin() {
        return userService.getAllUsers();
    }

    @PutMapping("/{id}/role")
    public UserDto updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        return userService.updateUserRole(id, roleStr);
    }
}