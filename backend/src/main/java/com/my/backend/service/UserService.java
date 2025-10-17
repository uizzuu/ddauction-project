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

    // 모든 유저 조회 (DTO 반환)
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

    // 유저 생성
    public UserDto createUser(UserDto dto) {
        User saved = userRepository.save(dto.toEntity());
        return UserDto.fromEntity(saved);
    }

    // DTO에서 id 가져와 업데이트
    public UserDto updateUser(UserDto dto) {
        Long id = dto.getUserId();
        if (id == null) throw new RuntimeException("업데이트할 사용자 ID가 필요합니다.");

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));

        if (dto.getUserName() != null) user.setUserName(dto.getUserName());
        if (dto.getNickName() != null) user.setNickName(dto.getNickName());
        if (dto.getPassword() != null) user.setPassword(passwordEncoder.encode(dto.getPassword()));
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());

        User updated = userRepository.save(user);
        return UserDto.fromEntity(updated);
    }

    // 유저 삭제
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
