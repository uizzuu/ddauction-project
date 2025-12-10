package com.my.backend.service;

import com.amazonaws.services.s3.AmazonS3;

import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Uploader {

    private final AmazonS3 amazonS3;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${spring.profiles.active}")
    private String activeProfile;

    public String upload(MultipartFile file, String dirName) throws IOException {
        return upload(file, dirName, null);
    }

    public String upload(MultipartFile file, String dirName, String customFileName) throws IOException {
        String fileName;
        String envPrefix = (activeProfile != null && !activeProfile.isEmpty()) ? activeProfile + "_" : "local_";

        if (customFileName != null && !customFileName.isBlank()) {
            // 확장자 추출
            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            fileName = dirName + "/" + envPrefix + customFileName + extension;
        } else {
            fileName = dirName + "/" + envPrefix + UUID.randomUUID() + "_" + file.getOriginalFilename();
        }

        // ObjectMetadata 설정 (스트림 버퍼 문제 해결)
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());

        try {
            // metadata 추가
            amazonS3.putObject(new PutObjectRequest(
                    bucket,
                    fileName,
                    file.getInputStream(),
                    metadata
            ));

            String url = amazonS3.getUrl(bucket, fileName).toString();
            return url;
        } catch (Exception e) {
            throw new RuntimeException("S3 업로드 실패: " + e.getMessage(), e);
        }
    }

    public void delete(String fileUrl) {
        try {
            String fileName = fileUrl.substring(fileUrl.indexOf(bucket) + bucket.length() + 1);
            amazonS3.deleteObject(bucket, fileName);
        } catch (Exception e) {
            throw new RuntimeException("S3 파일 삭제 실패: " + e.getMessage(), e);
        }
    }
}