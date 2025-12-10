package com.my.backend.dto;

import com.my.backend.entity.Address;
import com.my.backend.entity.EmailVerification;
import com.my.backend.entity.PhoneVerification;
import com.my.backend.entity.Users;
import com.my.backend.enums.Role;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UsersDto {

    private Long userId;
    private String userName;
    private String nickName;
    private String password;
    private String phone;
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Role role;
    private Long addressId;
    private Long emailVerificationId;
    private Long phoneVerificationId;
    private LocalDate birthday;
    private String businessNumber;
    private String address;
    private String zipCode;
    private String detailAddress;
    @Builder.Default
    private List<ImageDto> images = new ArrayList<>();


    // Entity → DTO
    public static UsersDto fromEntity(Users user) {
        if (user == null) return null;

        return UsersDto.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                .nickName(user.getNickName())
                .password(user.getPassword())
                .phone(user.getPhone())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .role(user.getRole())
                .addressId(user.getAddress() != null ? user.getAddress().getAddressId() : null)
                .address(user.getAddress() != null ? user.getAddress().getAddress() : null)
                .zipCode(user.getAddress() != null ? user.getAddress().getZipCode() : null)
                .detailAddress(user.getAddress() != null ? user.getAddress().getDetailAddress() : null)
                .emailVerificationId(user.getEmailVerification() != null ? user.getEmailVerification().getEmailVerificationId() : null)
                .phoneVerificationId(user.getPhoneVerification() != null ? user.getPhoneVerification().getPhoneVerificationId() : null)
                .birthday(user.getBirthday())
                .businessNumber(user.getBusinessNumber())
                .build();
    }

    // DTO → Entity
    public Users toEntity(Address address,
                          EmailVerification emailVerification,
                          PhoneVerification phoneVerification) {
        return Users.builder()
                .userId(this.userId)
                .userName(this.userName)
                .nickName(this.nickName)
                .password(this.password)
                .phone(this.phone)
                .email(this.email)
                .role(this.role != null ? this.role : Role.USER)
                .address(address)
                .emailVerification(emailVerification)
                .phoneVerification(phoneVerification)
                .birthday(this.birthday)
                .businessNumber(this.businessNumber)
                .build();
    }
}
