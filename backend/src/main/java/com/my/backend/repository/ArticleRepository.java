package com.my.backend.repository;

import com.my.backend.entity.Article;
import com.my.backend.enums.ArticleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    // 유저 ID로 글 조회
    List<Article> findByUserUserId(Long userId);

    List<Article> findByArticleType(ArticleType articleType);

}
