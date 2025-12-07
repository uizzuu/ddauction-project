package com.my.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.my.backend.dto.ChatRoomDto;
import com.my.backend.dto.PrivateChatDto;
import com.my.backend.dto.PublicChatDto;
import com.my.backend.dto.SimpleUserDto;
import com.my.backend.entity.ChatRoom;
import com.my.backend.entity.PrivateChat;
import com.my.backend.entity.Product;
import com.my.backend.entity.Users;
import com.my.backend.repository.ChatRoomRepository;
import com.my.backend.repository.PrivateChatRepository;
import com.my.backend.repository.ProductRepository;
import com.my.backend.repository.PublicChatRepository;
import com.my.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChattingService {

    private final PrivateChatRepository privateChatRepository;
    private final PublicChatRepository publicChatRepository;
    private final UserRepository usersRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ProductRepository productRepository;

    // ===================== 개인 채팅 저장 =====================
    public PrivateChatDto savePrivateChat(Long userId, Long targetUserId, Long productId, PrivateChatDto dto) {
        Users sender = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        Users seller = usersRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("상품 정보를 찾을 수 없습니다."));

        // 기존 방향
        Optional<ChatRoom> optionalChatRoom = chatRoomRepository
                .findBySellerUserIdAndSenderUserIdAndProductProductId(targetUserId, userId, productId);

        // 없으면 반대 방향 확인
        if (optionalChatRoom.isEmpty()) {
            optionalChatRoom = chatRoomRepository
                    .findBySenderUserIdAndSellerUserIdAndProductProductId(targetUserId, userId, productId); // ✔ 수정
        }

        ChatRoom chatRoom = optionalChatRoom.orElseGet(() -> {
            ChatRoom newRoom = ChatRoom.builder()
                    .seller(seller)
                    .sender(sender)
                    .product(product)
                    .build();
            return chatRoomRepository.save(newRoom);
        });

        PrivateChat chat = dto.toEntity(sender, chatRoom);
        PrivateChat saved = privateChatRepository.save(chat);

        return PrivateChatDto.fromEntity(saved);
    }

    // ===================== 개인 채팅 조회 =====================
    public List<PrivateChatDto> getPrivateChatsByUsers(Long userId, Long targetUserId, Long productId) {

        // 양방향 채팅방 모두 찾기
        Optional<ChatRoom> room1 = chatRoomRepository
                .findBySellerUserIdAndSenderUserIdAndProductProductId(targetUserId, userId, productId);

        Optional<ChatRoom> room2 = chatRoomRepository
                .findBySellerUserIdAndSenderUserIdAndProductProductId(userId, targetUserId, productId);

        List<PrivateChat> allMessages = new ArrayList<>();

        // 방향1 메시지
        room1.ifPresent(room ->
                allMessages.addAll(privateChatRepository.findByChatRoomIdOrderByCreatedAtAsc(room.getId()))
        );

        // 방향2 메시지
        room2.ifPresent(room ->
                allMessages.addAll(privateChatRepository.findByChatRoomIdOrderByCreatedAtAsc(room.getId()))
        );

        // 시간순 정렬 후 반환
        return allMessages.stream()
                .sorted(Comparator.comparing(PrivateChat::getCreatedAt))
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
        return publicChatRepository.findTop50ByOrderByCreatedAtAsc()
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

    // ===================== 채팅방 조회 또는 생성 =====================
    public ChatRoomDto getOrCreateChatRoom(Long userId, Long targetUserId, Long productId) {
        Users sender = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        Users seller = usersRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Target user not found"));

        // 기존 방향
        Optional<ChatRoom> optionalChatRoom = chatRoomRepository
                .findBySellerUserIdAndSenderUserIdAndProductProductId(targetUserId, userId, productId);

        // 없으면 반대 방향 확인
        if (optionalChatRoom.isEmpty()) {
            optionalChatRoom = chatRoomRepository
                    .findBySenderUserIdAndSellerUserIdAndProductProductId(targetUserId, userId, productId); // ✔ 수정
        }

        ChatRoom chatRoom = optionalChatRoom.orElseGet(() -> {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("상품 정보를 찾을 수 없습니다."));
            ChatRoom newRoom = ChatRoom.builder()
                    .seller(seller)
                    .sender(sender)
                    .product(product)
                    .build();
            return chatRoomRepository.save(newRoom);
        });

        return ChatRoomDto.builder()
                .chatRoomId(chatRoom.getId())
                .sellerId(chatRoom.getSeller().getUserId())
                .senderId(chatRoom.getSender().getUserId())
                .productId(chatRoom.getProduct() != null ? chatRoom.getProduct().getProductId() : null)
                .build();
    }
    // ===================== 채팅 삭제 (Soft Delete) =====================
    public void softDeletePublicChat(Long publicChatId) {
        publicChatRepository.findById(publicChatId).ifPresent(chat -> {
            chat.setDeleted(true);
            publicChatRepository.save(chat);
        });
    }

    public void softDeletePrivateChat(Long privateChatId) {
        privateChatRepository.findById(privateChatId).ifPresent(chat -> {
            chat.setDeleted(true);
            privateChatRepository.save(chat);
        });
    }

    // ===================== 채팅 검색 (Admin) =====================
    public List<PublicChatDto> searchPublicChats(String keyword) {
        // 실제로는 Repository에 findByContentContainingIgnoreCase 등을 추가해야 함.
        // 편의상 findAll 후 필터링 (데이터 많을 시 성능 이슈 주의)
        return publicChatRepository.findAll().stream()
                .filter(chat -> chat.getContent().contains(keyword) || 
                                (chat.getUser().getNickName() != null && chat.getUser().getNickName().contains(keyword)))
                .map(PublicChatDto::fromEntity)
                .sorted(Comparator.comparing(PublicChatDto::getCreatedAt))
                .collect(Collectors.toList());
    }

    public List<PrivateChatDto> searchPrivateChats(String keyword) {
        return privateChatRepository.findAll().stream()
                .filter(chat -> chat.getContent().contains(keyword) ||
                                (chat.getUser().getNickName() != null && chat.getUser().getNickName().contains(keyword)))
                .map(PrivateChatDto::fromEntity)
                .sorted(Comparator.comparing(PrivateChatDto::getCreatedAt))
                .collect(Collectors.toList());
    }
}
