package com.my.backend.dto;

import com.my.backend.entity.Address;
import com.my.backend.entity.EmailVerification;
import com.my.backend.entity.Image;
import com.my.backend.entity.PhoneVerification;
import com.my.backend.entity.Users;
import com.my.backend.enums.Role;
import lombok.*;

import java.time.LocalDateTime;
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
    private LocalDateTime birthday;
    private Long imageId; // 대표 이미지(첫번째 이미지)의 id를 담음

    // Entity → DTO
    public static UsersDto fromEntity(Users user) {
        if (user == null) return null;

        // 안전하게 images 리스트에서 첫 번째 이미지 ID를 가져옴
        Long firstImageId = null;
        if (user.getImages() != null && !user.getImages().isEmpty()) {
            // images가 List<Image>이므로 null/비어있음 체크 후 첫 요소에서 id 추출
            Image first = user.getImages().get(0);
            if (first != null) {
                firstImageId = first.getImageId();
            }
        }

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
                .emailVerificationId(user.getEmailVerification() != null ? user.getEmailVerification().getEmailVerificationId() : null)
                .phoneVerificationId(user.getPhoneVerification() != null ? user.getPhoneVerification().getPhoneVerificationId() : null)
                .birthday(user.getBirthday())
                .imageId(firstImageId)
                .build();
    }

    // DTO → Entity
    public Users toEntity(Address address,
                          EmailVerification emailVerification,
                          PhoneVerification phoneVerification,
                          Image image) {
        return Users.builder()
                .userId(this.userId)
                .userName(this.userName)
                .nickName(this.nickName)
                .password(this.password)
                .phone(this.phone)
                .email(this.email)
                .role(this.role)
                .address(address)
                .emailVerification(emailVerification)
                .phoneVerification(phoneVerification)
                // images는 Image 단일 입력을 받는 기존 메서드 사용시 수동으로 세팅 필요
                .birthday(this.birthday)
                .build();
    }
}
