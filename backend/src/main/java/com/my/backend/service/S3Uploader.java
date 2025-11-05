package com.my.backend.service;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.CannedAccessControlList;
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

    private final AmazonS3Client amazonS3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    public String upload(MultipartFile file, String dirName) throws IOException {
        String fileName = dirName + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

        amazonS3Client.putObject(new PutObjectRequest(
                bucket,
                fileName,
                file.getInputStream(),
                null
        ).withCannedAcl(CannedAccessControlList.PublicRead));

        return amazonS3Client.getUrl(bucket, fileName).toString(); // 업로드된 파일 URL 반환
    }

    public void delete(String fileUrl) {
        String fileName = fileUrl.substring(fileUrl.indexOf(bucket) + bucket.length() + 1);
        amazonS3Client.deleteObject(bucket, fileName);
    }
}


