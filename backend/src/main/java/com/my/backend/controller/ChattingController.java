package com.my.backend.controller;

import com.my.backend.dto.*;
import com.my.backend.entity.ChatRoom;
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

    // ===================== 공개 채팅 조회 =====================
    @GetMapping("/public/recent")
    public ResponseEntity<List<PublicChatDto>> getRecentPublicChats() {
        return ResponseEntity.ok(chatService.getRecentPublicChats());
    }
    // 채팅할 유저 조회
    @GetMapping("/users")
    public ResponseEntity<List<SimpleUserDto>> getAllUsers() {
        try {
            List<SimpleUserDto> users = chatService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/public")
    public List<PublicChatDto> getPublicChats() {
        return chatService.getRecentPublicChats();
    }


    @GetMapping("/private/room")
    public ResponseEntity<List<PrivateChatDto>> getPrivateChatsByRoom(
            @RequestParam Long userId,
            @RequestParam Long targetUserId,
            @RequestParam Long productId) {

        ChatRoomDto chatRoomDto = chatService.getOrCreateChatRoom(userId, targetUserId, productId);
        return ResponseEntity.ok(
                chatService.getPrivateChatsByUsers(userId, targetUserId, productId)
        );
    }

    // ===================== 개인 채팅 조회 =====================
    @GetMapping("/private/messages")
    public ResponseEntity<List<PrivateChatDto>> getMessages(
            @RequestParam Long userId,
            @RequestParam Long targetUserId,
            @RequestParam Long productId) {

        return ResponseEntity.ok(
                chatService.getPrivateChatsByUsers(userId, targetUserId, productId)
        );
    }

}
