package com.my.backend.service;

import com.my.backend.dto.auth.LoginRequest;
import com.my.backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class JoinService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    public JoinService(UserRepository userRepository, BCryptPasswordEncoder bCryptPasswordEncoder) {

        this.userRepository = userRepository;
        this.bCryptPasswordEncoder = bCryptPasswordEncoder;
    }
    /** 이거 안하려면 @RequiredArgsConstructor */

    public void joinProcess(LoginRequest loginRequest) {

        String userEmail = loginRequest.getEmail();
        String password = loginRequest.getPassword();

        Boolean isExist = userRepository.existsByEmail(userEmail);

        if (isExist) {
            return;
        }

        User data = new User();

        data.setEmail(userEmail);
        data.setPassword(bCryptPasswordEncoder.encode(password));
        data.setRole(User.Role.valueOf("USER"));

        userRepository.save(data);
    }
}