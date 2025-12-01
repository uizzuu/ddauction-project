package com.my.backend.service;

import com.my.backend.dto.PrivateChatDto;
import com.my.backend.dto.PublicChatDto;
import com.my.backend.dto.SimpleUserDto;
import com.my.backend.dto.UsersDto;
import com.my.backend.entity.Users;
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

    // ===================== 개인 채팅 =====================
    public PrivateChatDto savePrivateChat(Long userId, PrivateChatDto dto) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var chat = dto.toEntity(user);
        var saved = privateChatRepository.save(chat);
        return PrivateChatDto.fromEntity(saved);
    }

    public List<PrivateChatDto> getPrivateChatsByUser(Long userId) {
        return privateChatRepository.findByUserUserIdOrderByCreatedAtAsc(userId)
                .stream()
                .map(PrivateChatDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ===================== 공개 채팅 =====================
    public PublicChatDto savePublicChat(Long userId, PublicChatDto dto) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var chat = dto.toEntity(user);
        var saved = publicChatRepository.save(chat);
        return PublicChatDto.fromEntity(saved);
    }

    public List<PublicChatDto> getRecentPublicChats() {
        return publicChatRepository.findTop100ByOrderByCreatedAtAsc()
                .stream()
                .map(PublicChatDto::fromEntity)
                .collect(Collectors.toList());
    }
    // ===================== 유저 목록 =====================
    public List<SimpleUserDto> getAllUsers() {
        return usersRepository.findAll()
                .stream()
                .map(user -> new SimpleUserDto(user.getUserId(), user.getNickName()))
                .collect(Collectors.toList());
    }
}
