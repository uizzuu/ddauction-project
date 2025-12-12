package com.my.backend.repository;

import com.my.backend.entity.PrivateChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrivateChatRepository extends JpaRepository<PrivateChat, Long> {
    // 기존: 사용자가 작성한 메시지 조회
    List<PrivateChat> findByChatRoomIdOrderByCreatedAtAsc(Long chatRoomId);

    // 특정 채팅방(chatRoomId)의 가장 최근 메시지 1개 조회 (내림차순 정렬 후 최상위 1개)
    Optional<PrivateChat> findTopByChatRoomIdOrderByCreatedAtDesc(Long chatRoomId);
}
