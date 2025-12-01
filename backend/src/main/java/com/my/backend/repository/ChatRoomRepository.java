package com.my.backend.repository;

import com.my.backend.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // 상품 + 판매자 + 구매자 기준 채팅방 조회
    boolean existsBySellerUserIdAndSenderUserIdAndProductProductId(Long sellerId, Long senderId, Long productId);
}
