package com.my.backend.repository.board;

import com.my.backend.entity.board.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
        Optional<Board> findByBoardName(String boardName);
}
