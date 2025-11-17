package com.my.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class QRCodeService {

    /**
     * productId를 QR 코드 바이트 배열로 변환
     * @param productId 상품 ID
     * @param width QR 코드 가로 크기
     * @param height QR 코드 세로 크기
     * @return QR 코드 PNG 바이트 배열
     */
    public byte[] generateQRCodeBytes(Long productId, int width, int height)
            throws WriterException, IOException {

        // QR 코드에 담을 데이터 (productId만)
        String qrContent = String.valueOf(productId);

        // QR 코드 생성
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(
                qrContent,
                BarcodeFormat.QR_CODE,
                width,
                height
        );

        // BufferedImage로 변환
        BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

        // PNG 바이트 배열로 변환
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(qrImage, "PNG", baos);

        return baos.toByteArray();
    }
}