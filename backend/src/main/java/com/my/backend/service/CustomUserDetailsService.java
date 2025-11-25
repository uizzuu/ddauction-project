package com.my.backend.service;

import com.my.backend.dto.auth.CustomUserDetails;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
//        User user = userRepository.findById(Long.parseLong(userId))
//                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

//        return new org.springframework.security.core.userdetails.User(
//                String.valueOf(user.getUserId()),
//                user.getPassword(),
//                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
//        );

        // ✅ CustomUserDetails 반환
        return new CustomUserDetails(user);

    }
}
