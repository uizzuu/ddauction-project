package com.my.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload.directory:./uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

            // ✅ uploads 폴더가 없으면 자동 생성
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("✅ Created upload directory: " + uploadPath);
            }

            // ✅ /uploads/** 요청을 실제 파일 경로와 연결
            registry.addResourceHandler("/uploads/**")
                    .addResourceLocations("file:" + uploadPath.toString() + "/");

            System.out.println("✅ Serving static files from: " + uploadPath.toString());

        } catch (Exception e) {
            System.err.println("❌ Failed to configure upload directory: " + e.getMessage());
        }
    }
}