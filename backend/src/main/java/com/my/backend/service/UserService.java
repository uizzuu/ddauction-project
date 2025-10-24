package com.my.backend.service;

import com.my.backend.dto.UserDto;
import com.my.backend.entity.User;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // 모든 유저 조회
    public List<UserDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 단일 유저 조회
    public UserDto getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        return UserDto.fromEntity(user);
    }

    // 회원가입
    public UserDto createUser(UserDto dto) {
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            validatePassword(dto.getPassword()); // 비밀번호 유효성 검사
            dto.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        User saved = userRepository.save(dto.toEntity());
        return UserDto.fromEntity(saved);
    }

    // 로그인
    public UserDto login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("이메일 또는 비밀번호가 잘못되었습니다."));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("이메일 또는 비밀번호가 잘못되었습니다.");
        }

        return UserDto.fromEntity(user);
    }

    // 유저 정보 수정
    public UserDto updateUser(UserDto dto) {
        if (dto.getUserId() == null) throw new RuntimeException("수정할 사용자 ID가 필요합니다.");
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));

        if (dto.getUserName() != null && !dto.getUserName().isBlank()) {
            user.setUserName(dto.getUserName());
        }
        if (dto.getNickName() != null && !dto.getNickName().isBlank()) {
            user.setNickName(dto.getNickName());
        }
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            validatePassword(dto.getPassword()); // 비밀번호 유효성 검사
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            if (!dto.getPhone().matches("\\d{10,11}")) {
                throw new RuntimeException("전화번호는 숫자만 10~11자리여야 합니다.");
            }
            user.setPhone(dto.getPhone());
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            user.setEmail(dto.getEmail());
        }

        return UserDto.fromEntity(userRepository.save(user));
    }

    // 유저 삭제
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // 비밀번호 유효성 검사
    private void validatePassword(String password) {
        if (password == null || password.length() < 8)
            throw new IllegalArgumentException("비밀번호는 8자리 이상이어야 합니다.");
        if (!password.matches(".*[0-9].*"))
            throw new IllegalArgumentException("비밀번호에 최소 1개의 숫자가 포함되어야 합니다.");
        if (!password.matches(".*[!*@#].*"))
            throw new IllegalArgumentException("비밀번호에 최소 1개의 특수문자(!*@#)가 포함되어야 합니다.");
    }

    // 회원 정지 (role → BANNED)
    public UserDto banUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        user.setRole(User.Role.BANNED);
        return UserDto.fromEntity(userRepository.save(user));
    }

    // 회원 정지 해제 (role → USER)
    public UserDto unbanUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        user.setRole(User.Role.USER);
        return UserDto.fromEntity(userRepository.save(user));
    }

    // 이메일 또는 닉네임으로 검색
    public List<UserDto> searchUsers(String email, String nickName) {
        List<User> users;

        if (email != null && !email.isBlank() && nickName != null && !nickName.isBlank()) {
            users = userRepository.findByEmailContainingAndNickNameContaining(email, nickName);
        } else if (email != null && !email.isBlank()) {
            users = userRepository.findByEmailContaining(email);
        } else if (nickName != null && !nickName.isBlank()) {
            users = userRepository.findByNickNameContaining(nickName);
        } else {
            users = userRepository.findAll();
        }

        return users.stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    public UserDto updateUserRole(Long id, String roleStr) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        User.Role role;
        try {
            role = User.Role.valueOf(roleStr.toUpperCase()); // 안전하게 대문자로 변환
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("잘못된 역할입니다.");
        }

        user.setRole(role);
        userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    // 이름, 닉네임, 이메일, 비밀번호로 검색
    public List<UserDto> searchUsers(String userName, String nickName, String email, String phone) {
        List<User> users = userRepository.findAll(); // 전체 조회 후 필터링

        return users.stream()
                .filter(u -> userName == null || userName.isBlank() || u.getUserName().contains(userName))
                .filter(u -> nickName == null || nickName.isBlank() || u.getNickName().contains(nickName))
                .filter(u -> email == null || email.isBlank() || u.getEmail().contains(email))
                .filter(u -> phone == null || phone.isBlank() || u.getPhone().contains(phone))
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }
}