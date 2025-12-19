package com.my.backend.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.entity.Users;
import com.my.backend.enums.Role;
import com.my.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final com.my.backend.repository.UserBanRepository userBanRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다. email=" + email));

        // 1. 영구 정지(Role) 확인
        if (user.getRole() == Role.BANNED) {
            throw new org.springframework.security.authentication.LockedException("영구 정지된 계정입니다. 고객센터에 문의해주세요.");
        }

        // 2. 기간 정지(UserBan) 확인
        userBanRepository.findActiveByUserId(user.getUserId()).ifPresent(ban -> {
            if (ban.isExpired()) {
                // 기간 만료 시 자동 해제
                ban.setActive(false);
                userBanRepository.save(ban);
            } else {
                String msg = "서비스 이용이 정지된 계정입니다.";
                if (ban.getBanUntil() != null) {
                    msg += " (해제일: " + ban.getBanUntil().toLocalDate() + ")";
                }
                throw new org.springframework.security.authentication.LockedException(msg);
            }
        });

        return new CustomUserDetails(user);
    }
}