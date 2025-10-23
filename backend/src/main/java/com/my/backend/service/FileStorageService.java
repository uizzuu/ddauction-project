package com.my.backend.service;

import com.my.backend.config.FileUploadConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final FileUploadConfig fileUploadConfig;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "jpg", "jpeg", "png", "gif", "webp"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * 파일 저장
     */
    public ResponseEntity<Map<String, String>> storeFile(MultipartFile file) {
        try {
            // 1. 파일 검증
            if (file.isEmpty()) {
                throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
            }

            if (file.getSize() > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("파일 크기는 10MB를 초과할 수 없습니다.");
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                throw new IllegalArgumentException("파일명이 올바르지 않습니다.");
            }

            // 2. 확장자 검증
            String extension = getFileExtension(originalFilename);
            if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
                throw new IllegalArgumentException(
                        "허용되지 않는 파일 형식입니다. 허용: " + String.join(", ", ALLOWED_EXTENSIONS)
                );
            }

            // 3. 고유 파일명 생성
            String filename = UUID.randomUUID().toString() + "." + extension;
            Path targetLocation = fileUploadConfig.getUploadPath().resolve(filename);

            // 4. 파일 저장
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            log.info("파일 업로드 성공: {}", filename);
            String fileUrl = "/uploads/" + filename;

            return ResponseEntity.ok(Map.of(
                    "success", "true",
                    "fileUrl", fileUrl,
                    "message", "파일 업로드 성공"
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", e.getMessage()
            ));
        } catch (IOException e) {
            log.error("파일 업로드 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", "false",
                    "message", "파일 저장 중 오류가 발생했습니다."
            ));
        }
    }

    /**
     * 파일 삭제
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith("/uploads/")) {
            return;
        }

        try {
            String filename = fileUrl.substring("/uploads/".length());
            Path filePath = Paths.get(fileUploadConfig.getUploadDir()).resolve(filename);
            Files.deleteIfExists(filePath);
            log.info("파일 삭제 성공: {}", filename);
        } catch (IOException e) {
            log.error("파일 삭제 실패: {}", fileUrl, e);
        }
    }

    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1);
    }
}