package com.my.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public void sendVerificationEmail(String to, String code) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[DD Auction] 이메일 인증번호");

        // 🔥 수정됨: 링크 제거하고 인증번호만 발송
        message.setText(
                "요청하신 이메일 인증번호입니다.\n\n" +
                        "인증번호: " + code + "\n\n" +
                        "해당 번호를 회원가입 화면에 입력해주세요."
        );

        mailSender.send(message);
    }
}
