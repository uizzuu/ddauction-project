package com.my.backend.controller;

import com.my.backend.dto.PrivateChatDto;
import com.my.backend.dto.PublicChatDto;
import com.my.backend.service.ChattingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChattingController {

    private final ChattingService chatService;

    // ===================== 개인 채팅 조회 =====================
    @GetMapping("/private/{userId}")
    public ResponseEntity<List<PrivateChatDto>> getPrivateChats(@PathVariable Long userId) {
        return ResponseEntity.ok(chatService.getPrivateChatsByUser(userId));
    }

    // ===================== 공개 채팅 조회 =====================
    @GetMapping("/public/recent")
    public ResponseEntity<List<PublicChatDto>> getRecentPublicChats() {
        return ResponseEntity.ok(chatService.getRecentPublicChats());
    }
}
