package com.my.backend.repository;

import com.my.backend.entity.Report;
import com.my.backend.enums.ReportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    // 신고자별 신고 조회
    List<Report> findByUserUserId(Long userId);

    // 신고 대상(refId)별 신고 조회
    List<Report> findByRefId(Long refId);

    // 신고 타입별 조회
    List<Report> findByReportType(ReportType reportType);

    // 신고 대상 + 타입별 조회
    List<Report> findByRefIdAndReportType(Long refId, ReportType reportType);

    // 처리 상태별 조회
    List<Report> findByStatus(boolean status);
}