package com.my.backend.service;

import com.my.backend.dto.ReportDto;
import com.my.backend.entity.Report;
import com.my.backend.entity.User;
import com.my.backend.repository.ReportRepository;
import com.my.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReportDto createReport(Long reporterId, Long targetId, String reason) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new IllegalArgumentException("신고자 정보가 없습니다."));
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("대상 유저 정보가 없습니다."));

        Report report = Report.builder()
                .reporterId(reporter)
                .targetId(target)
                .reason(reason)
                .status(false)
                .build();

        Report saved = reportRepository.save(report);
        return ReportDto.fromEntity(saved);
    }

    public List<ReportDto> getReportsByTarget(Long targetId) {
        return reportRepository.findByTargetIdUserId(targetId)
                .stream()
                .map(ReportDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateReportStatus(Long reportId, boolean status) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("신고가 존재하지 않습니다."));
        report.setStatus(status);
    }

    // 🔥 내가 신고한 목록 조회
    public List<ReportDto> getReportsByReporter(Long reporterId) {
        return reportRepository.findByReporterIdUserId(reporterId)
                .stream()
                .map(ReportDto::fromEntity)
                .collect(Collectors.toList());
    }
    // 관리자용 신고목록 조회
    public List<ReportDto> getAllReports() {
        return reportRepository.findAll()
                .stream()
                .map(ReportDto::fromEntity)
                .collect(Collectors.toList());
    }

}
