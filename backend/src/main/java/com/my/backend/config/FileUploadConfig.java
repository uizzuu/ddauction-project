package com.my.backend.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Getter
@Configuration
public class FileUploadConfig implements WebMvcConfigurer {

    @Value("${file.upload.directory:./uploads}")
    private String uploadDir;
    private Path uploadPath;

    @PostConstruct
    public void initUploadDir() {
        try {
            uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (Exception e) {
            throw new RuntimeException("업로드 디렉토리 초기화 실패", e);
        }
    }
}