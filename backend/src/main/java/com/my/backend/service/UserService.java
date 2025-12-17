package com.my.backend.service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import com.my.backend.websocket.PublicChatWebSocketHandler;
import com.my.backend.entity.Report;
import com.my.backend.enums.ReportType;
import com.my.backend.enums.Role;
import com.my.backend.repository.ReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.my.backend.dto.ImageDto;
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

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AddressRepository addressRepository;
    private final ImageRepository imageRepository;
    private final S3Uploader s3Uploader;
    private final ReportRepository reportRepository;
    private final PublicChatWebSocketHandler publicChatWebSocketHandler;

    // 모든 유저 조회
    public List<UsersDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> {
                    UsersDto dto = UsersDto.fromEntity(user);
                    dto.setImages(getUserImages(user.getUserId()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // 단일 유저 조회
    public UsersDto getUser(@org.springframework.lang.NonNull Long id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        UsersDto dto = UsersDto.fromEntity(user);
        dto.setImages(getUserImages(id));
        return dto;
    }

    // 공개 유저 프로필 조회
    public UsersDto getPublicUser(@org.springframework.lang.NonNull Long id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        UsersDto dto = UsersDto.fromEntity(user);
        dto.setImages(getUserImages(id));
        
        // 민감 정보 삭제
        dto.setPassword(null);
        dto.setPhone(null);
        dto.setEmail(null); 
        dto.setAddress(null);
        dto.setDetailAddress(null);
        dto.setZipCode(null);
        dto.setBusinessNumber(null);
        dto.setRole(null); 
        
        return dto;
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
            if (!dto.getNickName().matches("^[가-힣a-zA-Z0-9]{3,12}$")) {
                throw new IllegalArgumentException("닉네임은 특수문자 없이 3~12자여야 합니다 (한글, 영문, 숫자).");
            }
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
        // 주소 저장
        if (dto.getAddress() != null && !dto.getAddress().isBlank()) {
            Address addressEntity = user.getAddress();
            if (addressEntity == null) {
                // 새 주소 생성
                addressEntity = Address.builder()
                        .address(dto.getAddress())
                        .detailAddress(dto.getDetailAddress())
                        .zipCode(dto.getZipCode())
                        .build();
                addressEntity = addressRepository.save(addressEntity);
                user.setAddress(addressEntity);
            } else {
                // 기존 주소 업데이트
                addressEntity.setAddress(dto.getAddress());
                addressEntity.setDetailAddress(dto.getDetailAddress());
                addressEntity.setZipCode(dto.getZipCode());
                addressRepository.save(addressEntity);
            }
        }
        
        // 생일 수정
        if (dto.getBirthday() != null) {
            user.setBirthday(dto.getBirthday());
        }
        
        // 소셜 연동 해제 (provider = "NONE" 일 경우 null 로 설정)
        if (dto.getProvider() != null) {
            if ("NONE".equals(dto.getProvider())) {
                user.setProvider(null);
            } else {
                user.setProvider(dto.getProvider());
            }
        }


        Users savedUser = userRepository.save(user);

        UsersDto savedDto = UsersDto.fromEntity(savedUser);
        savedDto.setImages(getUserImages(savedUser.getUserId()));
        return savedDto;
    }


    // 주소 정보 업데이트 (결제 페이지용)
    public void updateUserAddress(@org.springframework.lang.NonNull Long userId, String address, String detailAddress, String zipCode, String phone) {
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

    // 유저 삭제 (Soft Delete)
    @Transactional
    public void deleteUser(@org.springframework.lang.NonNull Long id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자가 존재하지 않습니다."));
        
        // 민감 정보 삭제 및 비식별화
        // DB Not Null 제약조건 대응: null 대신 비식별 데이터 저장
        user.setEmail("deleted-" + id + "@deleted.com"); 
        user.setPassword("DELETED_user_" + id); 
        
        // 전화번호: 10~11자리 숫자. Unique 제약 대응을 위해 ID 활용
        // 000 + ID (8자리 padding) -> 11자리
        // 예: ID 1 -> 00000000001
        String dummyPhone = String.format("000%08d", id);
        user.setPhone(dummyPhone);
        
        user.setUserName("탈퇴");
        
        // 닉네임 설정 (Regex: ^[가-힣a-zA-Z0-9]{3,12}+$)
        // "Del" + id. ID가 길어지면 앞에서부터 자르거나.. 
        // ID는 unique하므로 "Del" + id 도 unique함.
        // ID 최대 12글자 내로 맞추기. (Del: 3글자 + ID: 9글자) -> 10억 단위까지 OK.
        String newNickName = "Del" + id;
        if (newNickName.length() > 12) {
             // 12자 초과 시 뒤에서 자름 (Unique 보장을 위해 ID 뒷자리 사용 권장)
             newNickName = newNickName.substring(newNickName.length() - 12);
        }
        user.setNickName(newNickName);
        
        user.setProvider(null);
        user.setBusinessNumber(null);
        user.setAddress(null);
        user.setDeletedAt(java.time.LocalDateTime.now());
        
        userRepository.save(user);
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
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("사용자를 찾을 수 없습니다.");
        }

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
        String customFileName = "user_" + userId + "_" + System.currentTimeMillis();
        String imageUrl = s3Uploader.upload(file, "uploads/profile", customFileName);

        // 새 이미지 저장
        Image newImage = Image.builder()
                .imagePath(imageUrl)
                .imageType(ImageType.USER)
                .refId(userId)
                .build();

        imageRepository.save(newImage);

        return imageUrl;
    }

    // 프로필 이미지 목록 조회 (List<ImageDto>)
    private List<ImageDto> getUserImages(Long userId) {
        return imageRepository.findByRefIdAndImageType(userId, ImageType.USER)
                .stream()
                .map(ImageDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 프로필 이미지 삭제
    @Transactional
    public void deleteProfileImage(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("사용자를 찾을 수 없습니다.");
        }

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

    @Transactional
    public void banUser(Long userId, Long adminId) {
        Users target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("해당 유저가 없습니다."));

        if(target.getRole() == Role.BANNED) return;

        target.setRole(Role.BANNED);
        userRepository.save(target);

        Report report = Report.builder()
                .refId(userId)
                .reason("관리자에 의해 밴 처리됨")
                .status(true)
                .reportType(ReportType.PUBLIC_CHAT)
                .user(userRepository.findById(adminId).orElse(null))
                .build();
        reportRepository.save(report);

        // 기존 WebSocketHandler 이용해서 메시지 보내기
        publicChatWebSocketHandler.sendMessageToUser(userId, "관리자에 의해 밴 처리되었습니다."); // sendMessageToUser는 핸들러에 직접 만들어야 함
        // 1. 강제 로그아웃 명령 메시지 생성
        String logoutCommand = "{\"command\":\"FORCE_LOGOUT\", \"message\":\"관리자에 의해 밴 처리되어 로그아웃됩니다.\"}";

        // 2. WebSocket으로 명령 전송
        publicChatWebSocketHandler.sendMessageToUser(userId, logoutCommand);
    }
}