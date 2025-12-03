package com.my.backend.repository;

import com.my.backend.entity.SearchLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface SearchLogRepository extends JpaRepository<SearchLog, Long> {

    // 최근 10분간 검색된 키워드 조회
    @Query("""
        SELECT s.keyword
        FROM SearchLog s
        WHERE s.searchedAt >= :time
    """)
    List<String> findRecentKeywords(LocalDateTime time);
}

