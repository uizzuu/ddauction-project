package com.my.backend.service;

import com.my.backend.dto.UsersDto;
import com.my.backend.entity.Address;
import com.my.backend.entity.Users;
import com.my.backend.repository.AddressRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AddressRepository addressRepository;

    // 모든 유저 조회
    public List<UsersDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UsersDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 단일 유저 조회
    public UsersDto getUser(Long id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        return UsersDto.fromEntity(user);
    }


    // 로그인
    public UsersDto login(String email, String password) {
        Optional<Users> user = userRepository.findByEmail(email);
        if(user.isEmpty()) {
            throw new RuntimeException("이메일 또는 비밀번호가 잘못되었습니다.");
        }

        if (!passwordEncoder.matches(password, user.get().getPassword())) {
            throw new RuntimeException("이메일 또는 비밀번호가 잘못되었습니다.");
        }

        return UsersDto.fromEntity(user.orElse(null));
    }

    // 유저 정보 수정
    public UsersDto updateUser(UsersDto dto) {
        if (dto.getUserId() == null) throw new RuntimeException("수정할 사용자 ID가 필요합니다.");
        Users user = userRepository.findById(dto.getUserId())
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

        // Role 처리 추가
        if (dto.getRole() != null) {
            user.setRole(dto.getRole());
        }
        if (dto.getAddressId() != null) {
            Address address = findAddressOrNull(dto.getAddressId());
            user.setAddress(address);
        }


        return UsersDto.fromEntity(userRepository.save(user));
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
    private Address findAddressOrNull(Long id) {
        if (id == null) return null;
        return addressRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주소 정보가 존재하지 않습니다."));
    }


}