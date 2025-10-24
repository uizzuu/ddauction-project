package com.my.backend.service.board;

import com.my.backend.dto.board.ArticleDto;
import com.my.backend.entity.User;
import com.my.backend.entity.board.Article;
import com.my.backend.entity.board.Board;
import com.my.backend.repository.board.ArticleRepository;
import com.my.backend.repository.board.BoardRepository;
import com.my.backend.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final BoardRepository boardRepository;

    // DTO 직접 반환하는 커스텀 쿼리 이용 전체 글 조회
    public List<ArticleDto> getAllArticles() {
        return articleRepository.findAllUserNicknameAndBoardName();
    }

    // 페이징 조회 (엔티티 → DTO 매핑)
    public Page<ArticleDto> getArticlePage(Pageable pageable) {
        return articleRepository.findAll(pageable)
                .map(ArticleDto::fromEntity);
    }

    // 단건 조회
    public ArticleDto getOneArticle(Long id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다. id=" + id));
        return ArticleDto.fromEntity(article);
    }

    // 글 등록
    public ArticleDto insertArticle(ArticleDto articleDto) {
        User user = userRepository.findById(articleDto.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + articleDto.getUserId()));
        Board board = boardRepository.findById(articleDto.getBoardId())
                .orElseThrow(() -> new EntityNotFoundException("게시판을 찾을 수 없습니다. id=" + articleDto.getBoardId()));

        Article article = articleDto.toEntity(user, board);
        Article saved = articleRepository.save(article);
        return ArticleDto.fromEntity(saved);
    }

    // 글 수정
    public ArticleDto updateArticle(Long id, ArticleDto articleDto) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다. id=" + id));

        User user = userRepository.findById(articleDto.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다. id=" + articleDto.getUserId()));
        Board board = boardRepository.findById(articleDto.getBoardId())
                .orElseThrow(() -> new EntityNotFoundException("게시판을 찾을 수 없습니다. id=" + articleDto.getBoardId()));

        article.setUser(user);
        article.setBoard(board);
        article.setTitle(articleDto.getTitle());
        article.setContent(articleDto.getContent());

        Article updated = articleRepository.save(article);
        return ArticleDto.fromEntity(updated);
    }

    // 글 삭제
    public void deleteArticle(Long id) {
        articleRepository.deleteById(id);
    }
}
