package com.my.backend.repository;

import com.my.backend.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // 채팅방 존재 여부 확인
    boolean existsBySellerUserIdAndSenderUserIdAndProductProductId(Long sellerId, Long senderId, Long productId);

    // 채팅방 조회 (Optional로 반환)
    Optional<ChatRoom> findBySellerUserIdAndSenderUserIdAndProductProductId(Long sellerId, Long senderId, Long productId);
}
