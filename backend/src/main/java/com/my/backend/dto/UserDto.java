package com.my.backend.dto;

import com.my.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long userId;
    private String userName;
    private String nickName;
    private String password;
    private String phone;
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private User.Role role;


    public static UserDto fromEntity(User user) {
        return UserDto.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                .nickName(user.getNickName())
                .password(user.getPassword())
                .phone(user.getPhone())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .role(user.getRole())
                .build();
    }


    public User toEntity() {
        return User.builder()
                .userId(this.userId)
                .userName(this.userName)
                .nickName(this.nickName)
                .password(this.password)
                .phone(this.phone)
                .email(this.email)
                .role(this.role)
                .build();
    }
}

