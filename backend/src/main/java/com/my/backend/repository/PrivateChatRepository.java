package com.my.backend.repository;

import com.my.backend.entity.PrivateChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrivateChatRepository extends JpaRepository<PrivateChat, Long> {

    // 특정 사용자 관련 채팅 모두 조회 (예: 개인 채팅 내역)
    List<PrivateChat> findByUserUserIdOrderByCreatedAtAsc(Long userId);
}
