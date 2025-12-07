package com.my.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.my.backend.dto.ChatRoomDto;
import com.my.backend.dto.PrivateChatDto;
import com.my.backend.dto.PublicChatDto;
import com.my.backend.dto.SimpleUserDto;
import com.my.backend.service.ChattingService;

import lombok.RequiredArgsConstructor;

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

    // ===================== Admin: 채팅 검색 =====================
    @GetMapping("/admin/search/public")
    public ResponseEntity<List<PublicChatDto>> searchPublicChats(@RequestParam String keyword) {
        return ResponseEntity.ok(chatService.searchPublicChats(keyword));
    }

    @GetMapping("/admin/search/private")
    public ResponseEntity<List<PrivateChatDto>> searchPrivateChats(@RequestParam String keyword) {
        return ResponseEntity.ok(chatService.searchPrivateChats(keyword));
    }

    // ===================== Admin: 채팅 삭제 =====================
    @DeleteMapping("/public/{id}")
    public ResponseEntity<Void> deletePublicChat(@PathVariable Long id) {
        chatService.softDeletePublicChat(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/private/{id}")
    public ResponseEntity<Void> deletePrivateChat(@PathVariable Long id) {
        chatService.softDeletePrivateChat(id);
        return ResponseEntity.ok().build();
    }

}
