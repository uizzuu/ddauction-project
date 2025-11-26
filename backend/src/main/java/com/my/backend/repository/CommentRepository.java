package com.my.backend.repository;

import com.my.backend.entity.Article;
import com.my.backend.entity.Comment;
import com.my.backend.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    // 특정 Article의 댓글 리스트 조회
    List<Comment> findByArticle(Article article);
    List<Comment> findByArticleArticleId(Long articleId);

    // User별 댓글 조회
    List<Comment> findByUser(Users user);

}
