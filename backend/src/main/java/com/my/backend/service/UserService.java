package com.my.backend.service;

import com.my.backend.dto.UserUpdateDto;
import com.my.backend.entity.User;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User updateUser(Long id, User updatedUser) {
        User user = getUser(id);
        user.setUserName(updatedUser.getUserName());
        user.setNickName(updatedUser.getNickName());
        user.setPassword(updatedUser.getPassword());
        user.setPhone(updatedUser.getPhone());
        user.setEmail(updatedUser.getEmail());
        user.setRole(updatedUser.getRole());
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public User updateUserInfo(Long id, UserUpdateDto dto) {
        User user = getUser(id);

        if (dto.getNickName() != null) user.setNickName(dto.getNickName());
        if (dto.getPassword() != null) user.setPassword(dto.getPassword());
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());

        return userRepository.save(user);
    }

}
