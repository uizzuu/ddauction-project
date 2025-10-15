package com.my.backend.repository;

import com.my.backend.dto.BoardDto;
import com.my.backend.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {
    /**
     * Board 엔티티와 User 엔티티를 JOIN 하여
     * BoardDto에 필요한 필드들만 선택해서 조회,
     * 이렇게 하면 Board와 User 객체 전체를 조회하지 않고,
     * 필요한 컬럼만 DB에서 가져오므로 성능 최적화됨.
     * 닉네임을 바꿀때 바로 적용하려면 이렇게 해야함
     *List<BoardDto> - Board와 User 닉네임이 포함된 DTO 리스트
     */
    @Query("SELECT new com.my.backend.dto.BoardDto(b.boardId, u.userId, u.nickName, b.title, b.content, b.createdAt, b.updatedAt) " +
            "FROM Board b JOIN b.user u")
    List<BoardDto> findAllUserNickname();
}

