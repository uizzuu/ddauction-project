package com.my.backend.controller;

import com.my.backend.service.S3Uploader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class S3FileController {

    private final S3Uploader s3Uploader;

    @PostMapping("/s3-upload")
    public ResponseEntity<Map<String, String>> uploadToS3(@RequestPart("file") MultipartFile file) throws IOException {
        try {
            String url = s3Uploader.upload(file, "uploads");
            log.info("S3 업로드 성공: {}", url);

            return ResponseEntity.ok(Map.of("url", url));  // ✅ JSON 형식으로 반환
        } catch (Exception e) {
            log.error("S3 업로드 실패", e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "S3 업로드 실패: " + e.getMessage()));
        }
    }
}

