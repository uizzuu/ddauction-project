package com.my.backend.controller;

import com.google.zxing.WriterException;
import com.my.backend.service.QRCodeService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/qrcode")
public class QRCodeController {


    private final QRCodeService qrCodeService;

    public QRCodeController(QRCodeService qrCodeService) {
        this.qrCodeService = qrCodeService;
    }

    // QR 코드 이미지 생성 및 반환
    @GetMapping(value = "/{productId}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQRCode(@PathVariable Long productId) {
        try {
            // 300x300 크기의 QR 코드 생성
            byte[] qrCode = qrCodeService.generateQRCodeBytes(productId, 300, 300);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setCacheControl("no-cache"); // 캐시 방지

            return new ResponseEntity<>(qrCode, headers, HttpStatus.OK);

        } catch (WriterException | IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

/*
사용 예시 및 테스트
브라우저에서 테스트:
http://localhost:8080/api/qrcode/1
http://localhost:8080/api/qrcode/123

→ QR 코드 이미지가 바로 표시됨

프론트엔드 사용:
<img src="http://localhost:8080/api/qrcode/123" alt="QR Code" />

또는

const qrUrl = `${API_BASE_URL}/api/qrcode/${productId}`;
<img src={qrUrl} alt="QR" />
*/
