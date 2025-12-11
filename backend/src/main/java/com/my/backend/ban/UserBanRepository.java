package com.my.backend.ban;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserBanRepository extends JpaRepository<UserBan, Long> {

    /**
     * 특정 유저의 활성화된 제재 조회
     */
    @Query("SELECT ub FROM UserBan ub WHERE ub.user.userId = :userId AND ub.active = true")
    Optional<UserBan> findActiveByUserId(@Param("userId") Long userId);

    /**
     * 특정 유저의 모든 제재 이력 조회
     */
    @Query("SELECT ub FROM UserBan ub WHERE ub.user.userId = :userId ORDER BY ub.createdAt DESC")
    List<UserBan> findAllByUserId(@Param("userId") Long userId);

    /**
     * 만료된 제재 목록 조회 (배치 작업용)
     */
    @Query("SELECT ub FROM UserBan ub WHERE ub.active = true AND ub.banUntil < :now")
    List<UserBan> findExpiredBans(@Param("now") LocalDateTime now);

    /**
     * 활성화된 모든 제재 조회 (관리자 페이지용)
     */
    @Query("SELECT ub FROM UserBan ub WHERE ub.active = true ORDER BY ub.createdAt DESC")
    List<UserBan> findAllActiveBans();
}