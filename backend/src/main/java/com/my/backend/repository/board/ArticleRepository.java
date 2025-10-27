package com.my.backend.repository.board;

import com.my.backend.dto.board.ArticleDto;
import com.my.backend.entity.board.Article;
import com.my.backend.entity.board.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    // 유저 닉네임 + 게시판 이름 포함해서 DTO 조회
    @Query("SELECT new com.my.backend.dto.board.ArticleDto(" +
            "a.articleId, u.userId, u.nickName, b.boardId, b.boardName, a.title, a.content, a.createdAt, a.updatedAt) " +
            "FROM Article a " +
            "JOIN a.user u " +
            "JOIN a.board b")
    List<ArticleDto> findAllUserNicknameAndBoardName();

    // 유저 ID로 글 조회
    List<Article> findByUserUserId(Long userId);

    // 게시판 기준으로 글 조회
    List<Article> findByBoard(Board board);

    // 유저 ID + 게시판 기준으로 글 조회 (1:1 문의 조회에 사용)
    List<Article> findByUserUserIdAndBoard(Long userId, Board board);
}
