//package com.my.backend.controller.board;
//
//import com.my.backend.dto.BoardDto;
//import lombok.RequiredArgsConstructor;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.Pageable;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//
//@RestController
//@RequestMapping("/api/boards")
//@RequiredArgsConstructor
//public class ArticleController {
//
//    private final BoardService boardService;
//
//    // 1. 전체 게시글 목록 조회
//    @GetMapping
//    public ResponseEntity<List<BoardDto>> getAllBoards() {
//        List<BoardDto> boards = boardService.getAllBoards();
//        return ResponseEntity.ok(boards);
//    }
//
//    // 2. 페이징된 게시글 목록 조회 (예: /api/boards?page=0&size=10)
//    @GetMapping("/page")
//    public ResponseEntity<Page<BoardDto>> getBoardPage(Pageable pageable) {
//        Page<BoardDto> boardPage = boardService.getBoardPage(pageable);
//        return ResponseEntity.ok(boardPage);
//    }
//
//    // 3. 특정 게시글 조회
//    @GetMapping("/{id}")
//    public ResponseEntity<BoardDto> getBoard(@PathVariable Long id) {
//        BoardDto boardDto = boardService.getOneBoard(id);
//        if (boardDto == null) {
//            return ResponseEntity.notFound().build();
//        }
//        return ResponseEntity.ok(boardDto);
//    }
//
//    // 4. 게시글 생성
//    @PostMapping
//    public ResponseEntity<BoardDto> createBoard(@RequestBody BoardDto boardDto) {
//        BoardDto created = boardService.insertBoard(boardDto);
//        return ResponseEntity.ok(created);
//    }
//
//    // 5. 게시글 수정
//    @PutMapping("/{id}")
//    public ResponseEntity<BoardDto> updateBoard(@PathVariable Long id, @RequestBody BoardDto boardDto) {
//        BoardDto updated = boardService.updateBoard(id, boardDto);
//        return ResponseEntity.ok(updated);
//    }
//
//    // 6. 게시글 삭제
//    @DeleteMapping("/{id}")
//    public ResponseEntity<Void> deleteBoard(@PathVariable Long id) {
//        boardService.deleteBoard(id);
//        return ResponseEntity.noContent().build();
//    }
//}
