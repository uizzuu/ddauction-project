package com.my.backend.repository;

import com.my.backend.dto.ArticleDto;
import com.my.backend.entity.Article;
import com.my.backend.enums.ArticleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    // 유저 닉네임 + 게시판 이름 포함해서 DTO 조회
    @Query("SELECT new com.my.backend.dto.board.ArticleDto(" +
            "a.articleId, u.userId, u.nickName, b.boardId, b.boardName, a.title, a.content, a.createdAt, a.updatedAt) " +
            "FROM Article a " +
            "JOIN a.user u " +
            "JOIN a.board b " +
            "WHERE b.boardId = :boardId")
    List<ArticleDto> findAllByBoardId(@Param("boardId") Long boardId);

    // 유저 ID로 글 조회
    List<Article> findByUserUserId(Long userId);

    List<Article> findByArticleType(ArticleType articleType);


}
