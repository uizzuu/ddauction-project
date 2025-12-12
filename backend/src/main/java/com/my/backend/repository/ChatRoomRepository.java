package com.my.backend.repository;

import com.my.backend.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // 채팅방 존재 여부 확인
    boolean existsBySellerUserIdAndSenderUserIdAndProductProductId(Long sellerId, Long senderId, Long productId);

    // 채팅방 조회 (Optional로 반환)
    Optional<ChatRoom> findBySellerUserIdAndSenderUserIdAndProductProductId(Long sellerId, Long senderId, Long productId);
    Optional<ChatRoom> findBySenderUserIdAndSellerUserIdAndProductProductId(Long senderId, Long sellerId, Long productId);

    // userId가 Sender(구매자) 이거나 Seller(판매자)인 모든 방을 최신 업데이트순으로 정렬하여 조회
    List<ChatRoom> findBySenderUserIdOrSellerUserIdOrderByCreatedAtDesc(Long senderUserId, Long sellerUserId);
}

