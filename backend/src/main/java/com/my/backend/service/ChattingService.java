package com.my.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.my.backend.ban.UserBanRepository;
import com.my.backend.dto.*;
import org.springframework.stereotype.Service;

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
    private final UserBanRepository userBanRepository;
    public boolean isUserBanned(Long userId) {
        return userBanRepository.existsByUser_UserIdAndActiveTrue(userId);
    }


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

    public List<PrivateChatDto> getPrivateChatsByRoomId(Long chatRoomId) {
        List<PrivateChat> messages = privateChatRepository.findByChatRoomIdOrderByCreatedAtAsc(chatRoomId);

        // isDeleted 필터링은 프론트엔드에서 처리한다고 가정하고, 여기서는 그냥 반환합니다.
        return messages.stream()
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

    // ===================== 채팅방 목록 조회 (판매자/구매자 모두 사용) =====================
    public List<ChatRoomListDto> getMyChatRooms(Long userId) {
        // 1. 내가 Sender(구매자)이거나 Seller(판매자)인 모든 채팅방을 찾습니다.
        List<ChatRoom> rooms = chatRoomRepository.findBySenderUserIdOrSellerUserIdOrderByCreatedAtDesc(userId, userId);

        // 2. DTO로 변환
        return rooms.stream().map(room -> {

            // 상대방(Target) 결정
            Users targetUser;
            // 로그인한 유저가 이 방의 구매자(sender)라면, 상대는 판매자(seller)
            if (room.getSender().getUserId().equals(userId)) {
                targetUser = room.getSeller();
            } else {
                // 로그인한 유저가 이 방의 판매자(seller)라면, 상대는 구매자(sender)
                targetUser = room.getSender();
            }

            // 마지막 메시지 가져오기 (성능을 위해 ChatRoom 엔티티에 필드를 추가하거나, 별도 쿼리 필요)
            // 여기서는 가장 최근 PrivateChat을 쿼리합니다.
            PrivateChat lastChat = privateChatRepository.findTopByChatRoomIdOrderByCreatedAtDesc(room.getId())
                    .orElse(null);

            return ChatRoomListDto.builder()
                    .chatRoomId(room.getId())
                    .productId(room.getProduct().getProductId())
                    .productTitle(room.getProduct().getTitle()) // 상품 제목이 Product 엔티티에 있다고 가정

                    // 상대방 정보
                    .targetUserId(targetUser.getUserId())
                    .targetNickName(targetUser.getNickName())

                    // 마지막 메시지 정보
                    .lastMessage(lastChat != null ? lastChat.getContent() : "")
                    .lastMessageTime(lastChat != null ? lastChat.getCreatedAt() : room.getCreatedAt())
                    // * unreadCount 등은 별도 로직/쿼리 필요 (생략)
                    .build();
        }).collect(Collectors.toList());
    }

    // ===================== 관리자: 모든 채팅방 목록 조회 [⭐ 추가 ⭐] =====================
    /**
     * 관리자 전용: 시스템 내의 모든 1:1 채팅방 목록을 판매자/구매자 정보를 포함하여 조회합니다.
     */
    public List<AdminChatRoomListDto> getAllAdminChatRooms() {
        // 모든 채팅방을 가져옵니다. (JOIN FETCH를 사용하여 N+1 문제 방지 권장)
        // ChatRoom 엔티티에 Seller, Sender, Product 정보가 Eager 로딩되거나,
        // Repository에 JOIN FETCH 쿼리를 추가했다고 가정합니다.
        List<ChatRoom> rooms = chatRoomRepository.findAll();

        return rooms.stream()
                .map(room -> {
                    // 1. 마지막 메시지 가져오기
                    PrivateChat lastChat = privateChatRepository.findTopByChatRoomIdOrderByCreatedAtDesc(room.getId())
                            .orElse(null);

                    // 2. DTO 빌드
                    return AdminChatRoomListDto.builder()
                            .chatRoomId(room.getId())

                            // 상품 정보
                            .productId(room.getProduct().getProductId())
                            .productTitle(room.getProduct().getTitle())

                            // 판매자 정보 (Seller 엔티티를 판매자로 가정)
                            .sellerId(room.getSeller().getUserId())
                            .sellerNickName(room.getSeller().getNickName())
                            // .sellerName(room.getSeller().getUserName()) // 필요시 추가

                            // 구매자 정보 (Sender 엔티티를 구매자로 가정)
                            .buyerId(room.getSender().getUserId())
                            .buyerNickName(room.getSender().getNickName())
                            // .buyerName(room.getSender().getUserName()) // 필요시 추가

                            // 메시지 정보
                            .lastMessage(lastChat != null ? lastChat.getContent() : "")
                            .lastMessageTime(lastChat != null ? lastChat.getCreatedAt() : room.getCreatedAt())
                            .build();
                })
                // 최근 활동 시간 순으로 정렬
                .sorted(Comparator.comparing(AdminChatRoomListDto::getLastMessageTime, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }
}
