package com.my.backend.service;

import com.my.backend.dto.ReportDto;
import com.my.backend.entity.Report;
import com.my.backend.entity.Users;
import com.my.backend.enums.ReportType;
import com.my.backend.repository.ReportRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    // 신고 생성
    @Transactional
    public ReportDto createReport(Long reporterId, Long refId, String reason, ReportType reportType) {
        Users reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new EntityNotFoundException("신고자 정보가 없습니다. id=" + reporterId));

        Report report = Report.builder()
                .user(reporter)
                .refId(refId)
                .reason(reason)
                .reportType(reportType)
                .status(false)
                .build();

        Report saved = reportRepository.save(report);
        return ReportDto.fromEntity(saved);
    }

    // 특정 대상(refId)에 대한 신고 조회
    public List<ReportDto> getReportsByTarget(Long refId) {
        return reportRepository.findByRefId(refId).stream()
                .map(ReportDto::fromEntity)
                .toList();
    }

    // 신고 상태 변경 (관리자용)
    @Transactional
    public void updateReportStatus(Long reportId, boolean status) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("신고가 존재하지 않습니다. id=" + reportId));
        report.setStatus(status);
    }

    // 신고 답변 등록 (관리자용)
    @Transactional
    public void answerReport(Long reportId, String answer) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("신고가 존재하지 않습니다. id=" + reportId));
        report.setAnswer(answer);
        report.setStatus(true); // 답변 시 자동으로 처리 완료
    }

    // 내가 신고한 목록 조회 (마이페이지용)
    public List<ReportDto> getReportsByReporter(Long reporterId) {
        return reportRepository.findByUserUserId(reporterId).stream()
                .map(ReportDto::fromEntity)
                .toList();
    }

    // 관리자용 전체 신고 목록 조회
    public List<ReportDto> getAllReports() {
        return reportRepository.findAll().stream()
                .map(ReportDto::fromEntity)
                .toList();
    }

    // 신고 타입별 조회
    public List<ReportDto> getReportsByType(ReportType reportType) {
        return reportRepository.findByReportType(reportType).stream()
                .map(ReportDto::fromEntity)
                .toList();
    }

    // 처리 상태별 조회
    public List<ReportDto> getReportsByStatus(boolean status) {
        return reportRepository.findByStatus(status).stream()
                .map(ReportDto::fromEntity)
                .toList();
    }
}