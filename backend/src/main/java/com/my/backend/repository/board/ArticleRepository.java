package com.my.backend.repository.board;

import com.my.backend.dto.board.ArticleDto;
import com.my.backend.entity.board.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    @Query("SELECT new com.my.backend.dto.board.ArticleDto(" +
            "a.articleId, u.userId, u.nickName, b.boardId, b.boardName, a.title, a.content, a.createdAt, a.updatedAt) " +
            "FROM Article a " +
            "JOIN a.user u " +
            "JOIN a.board b")
    List<ArticleDto> findAllUserNicknameAndBoardName();
}
