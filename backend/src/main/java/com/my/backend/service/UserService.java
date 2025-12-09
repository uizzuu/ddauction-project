package com.my.backend.service;

import com.my.backend.dto.UsersDto;
import com.my.backend.entity.Address;
import com.my.backend.entity.Image;
import com.my.backend.entity.Users;
import com.my.backend.enums.ImageType;
import com.my.backend.repository.AddressRepository;
import com.my.backend.repository.ImageRepository;
import com.my.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AddressRepository addressRepository;
    private final ImageRepository imageRepository;
    private final S3Uploader s3Uploader;



    // 모든 유저 조회
    public List<UsersDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> UsersDto.fromEntity(user, getProfileImageUrl(user.getUserId())))
                .collect(Collectors.toList());
    }

    // 단일 유저 조회
    public UsersDto getUser(Long id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        String profileImageUrl = getProfileImageUrl(id); // 프로필 이미지 URL 가져오기
        return UsersDto.fromEntity(user, profileImageUrl);
    }


    // 로그인
    public UsersDto login(String email, String password) {
        Optional<Users> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("이메일 또는 비밀번호가 잘못되었습니다.");
        }

        Users user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("이메일 또는 비밀번호가 잘못되었습니다.");
        }

        // 프로필 이미지 URL 가져오기
        String profileImageUrl = getProfileImageUrl(user.getUserId());

        // DTO 변환
        return UsersDto.fromEntity(user, profileImageUrl);
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
            validatePassword(dto.getPassword());
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        if (dto.getPhone() != null && !dto.getPhone().isBlank()) {
            String normalizedPhone = dto.getPhone().replaceAll("[^0-9]", "");
            if (!normalizedPhone.matches("^01[0-9]\\d{7,8}$")) {
                throw new RuntimeException("올바른 전화번호 형식이 아닙니다. (예: 01012345678)");
            }
            user.setPhone(normalizedPhone);
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            user.setEmail(dto.getEmail());
        }

        if (dto.getRole() != null) {
            user.setRole(dto.getRole());
        }
        if (dto.getAddressId() != null) {
            Address address = findAddressOrNull(dto.getAddressId());
            user.setAddress(address);
        }


        Users savedUser = userRepository.save(user);

        // 프로필 이미지 URL 가져오기
        String profileImageUrl = getProfileImageUrl(savedUser.getUserId());

        return UsersDto.fromEntity(savedUser, profileImageUrl);
    }


    // 주소 정보 업데이트 (결제 페이지용)
    public void updateUserAddress(Long userId, String address, String detailAddress, String zipCode, String phone) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        Address addressEntity = user.getAddress();
        if (addressEntity == null) {
            addressEntity = Address.builder()
                    .address(address)
                    .detailAddress(detailAddress)
                    .zipCode(zipCode)
                    .build();
            addressEntity = addressRepository.save(addressEntity);
            user.setAddress(addressEntity);
        } else {
            // 기존 주소 업데이트
            addressEntity.setAddress(address);
            addressEntity.setDetailAddress(detailAddress);
            addressEntity.setZipCode(zipCode);
            addressRepository.save(addressEntity);
        }
        // 전화번호 업데이트
        if (phone != null && !phone.isBlank()) {
            String normalizedPhone = phone.replaceAll("[^0-9]", "");
            if (!normalizedPhone.matches("^01[0-9]\\d{7,8}$")) {
                throw new RuntimeException("올바른 전화번호 형식이 아닙니다. (예: 01012345678)");
            }
            user.setPhone(normalizedPhone);
        }
        userRepository.save(user);
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

    // 프로필 이미지 URL 조회
    public String getProfileImageUrl(Long userId) {
        List<Image> images = imageRepository.findByRefIdAndImageType(userId, ImageType.USER);
        if (images.isEmpty()) {
            return null;
        }
        return images.get(0).getImagePath();
    }

    // 프로필 이미지 등록/수정
    @Transactional
    public String updateProfileImage(Long userId, MultipartFile file) throws IOException {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 기존 프로필 이미지 삭제
        List<Image> existingImages = imageRepository.findByRefIdAndImageType(userId, ImageType.USER);
        if (!existingImages.isEmpty()) {
            Image existingImage = existingImages.get(0);
            // S3에서 삭제
            try {
                s3Uploader.delete(existingImage.getImagePath());
            } catch (Exception e) {
                // S3 삭제 실패해도 DB는 삭제
                System.err.println("S3 이미지 삭제 실패: " + e.getMessage());
            }
            imageRepository.delete(existingImage);
        }

        // S3 업로드
        String imageUrl = s3Uploader.upload(file, "profile");

        // 새 이미지 저장
        Image newImage = Image.builder()
                .imagePath(imageUrl)
                .imageType(ImageType.USER)
                .refId(userId)
                .build();

        imageRepository.save(newImage);

        return imageUrl;
    }

    // 프로필 이미지 삭제
    @Transactional
    public void deleteProfileImage(Long userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        List<Image> existingImages = imageRepository.findByRefIdAndImageType(userId, ImageType.USER);
        if (!existingImages.isEmpty()) {
            Image existingImage = existingImages.get(0);
            // S3에서 삭제
            try {
                s3Uploader.delete(existingImage.getImagePath());
            } catch (Exception e) {
                System.err.println("S3 이미지 삭제 실패: " + e.getMessage());
            }
            imageRepository.delete(existingImage);
        }
    }
}