package com.my.backend.repository;

import com.my.backend.entity.PrivateChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrivateChatRepository extends JpaRepository<PrivateChat, Long> {
    // 기존: 사용자가 작성한 메시지 조회
    List<PrivateChat> findByChatRoomIdOrderByCreatedAtAsc(Long chatRoomId);
}
