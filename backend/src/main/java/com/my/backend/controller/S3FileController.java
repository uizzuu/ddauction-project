package com.my.backend.controller;

import com.my.backend.service.S3Uploader;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class S3FileController {

    private final S3Uploader s3Uploader;

    @PostMapping("/s3-upload")
    public ResponseEntity<String> uploadToS3(@RequestPart("file") MultipartFile file) throws IOException {
        String url = s3Uploader.upload(file, "uploads");
        return ResponseEntity.ok(url);
    }
}

