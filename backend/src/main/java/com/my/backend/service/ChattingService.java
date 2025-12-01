package com.my.backend.service;

import com.my.backend.dto.PrivateChatDto;
import com.my.backend.dto.PublicChatDto;
import com.my.backend.dto.SimpleUserDto;
import com.my.backend.entity.ChatRoom;
import com.my.backend.entity.PrivateChat;
import com.my.backend.entity.Users;
import com.my.backend.repository.ChatRoomRepository;
import com.my.backend.repository.PrivateChatRepository;
import com.my.backend.repository.PublicChatRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChattingService {

    private final PrivateChatRepository privateChatRepository;
    private final PublicChatRepository publicChatRepository;
    private final UserRepository usersRepository;
    private final ChatRoomRepository chatRoomRepository;

    // ===================== 개인 채팅 저장 =====================
    public PrivateChatDto savePrivateChat(Long userId, PrivateChatDto dto) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ChatRoom 조회
        ChatRoom chatRoom = chatRoomRepository.findById(dto.getChatRoomId())
                .orElseThrow(() -> new RuntimeException("ChatRoom not found"));

        // DTO → Entity
        PrivateChat chat = dto.toEntity(user, chatRoom);

        // DB 저장
        PrivateChat saved = privateChatRepository.save(chat);

        return PrivateChatDto.fromEntity(saved);
    }

    // ===================== 개인 채팅 조회 =====================
    public List<PrivateChatDto> getPrivateChatsByUser(Long userId) {
        // 참여한 채팅방 기준 메시지 모두 조회
        List<PrivateChat> chats = privateChatRepository.findByChatRoomSellerUserIdOrChatRoomSenderUserIdOrderByCreatedAtAsc(userId, userId);
        return chats.stream()
                .map(PrivateChatDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ===================== 공개 채팅 저장 =====================
    public PublicChatDto savePublicChat(Long userId, PublicChatDto dto) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var chat = dto.toEntity(user);
        var saved = publicChatRepository.save(chat);
        return PublicChatDto.fromEntity(saved);
    }

    // ===================== 공개 채팅 조회 =====================
    public List<PublicChatDto> getRecentPublicChats() {
        return publicChatRepository.findTop100ByOrderByCreatedAtAsc()
                .stream()
                .map(PublicChatDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ===================== 유저 목록 조회 =====================
    public List<SimpleUserDto> getAllUsers() {
        return usersRepository.findAll()
                .stream()
                .map(user -> new SimpleUserDto(user.getUserId(), user.getNickName()))
                .collect(Collectors.toList());
    }

}
