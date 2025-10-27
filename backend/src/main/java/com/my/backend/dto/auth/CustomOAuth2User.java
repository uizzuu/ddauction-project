package com.my.backend.dto.auth;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

public class CustomOAuth2User implements OAuth2User {

    private final Long userId;
    private final String email;
    private final String role;
    private final Map<String, Object> attributes;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomOAuth2User(Long userId,
                            String email,
                            String role,
                            Map<String, Object> attributes,
                            Collection<? extends GrantedAuthority> authorities) {
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.attributes = attributes;
        this.authorities = authorities;
    }

    public Long getUserId() { return userId; }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    // 기본 식별자 반환용 (예: "sub" or "id")
    @Override
    public String getName() {
        return email;
    }
}
