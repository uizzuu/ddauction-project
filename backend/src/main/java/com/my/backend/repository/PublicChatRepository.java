package com.my.backend.repository;

import com.my.backend.entity.PublicChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PublicChatRepository extends JpaRepository<PublicChat, Long> {

    // 최근 공개 채팅 가져오기
    List<PublicChat> findTop100ByOrderByCreatedAtAsc();
}
