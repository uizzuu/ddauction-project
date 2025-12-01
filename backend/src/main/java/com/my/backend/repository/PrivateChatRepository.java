package com.my.backend.repository;

import com.my.backend.entity.PrivateChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrivateChatRepository extends JpaRepository<PrivateChat, Long> {
    // 기존: 사용자가 작성한 메시지 조회
    List<PrivateChat> findByUserUserIdOrderByCreatedAtAsc(Long userId);

    // 새로 추가: 채팅방 참여자 기준 메시지 조회
    List<PrivateChat> findByChatRoomSellerUserIdOrChatRoomSenderUserIdOrderByCreatedAtAsc(Long sellerId, Long senderId);

}
