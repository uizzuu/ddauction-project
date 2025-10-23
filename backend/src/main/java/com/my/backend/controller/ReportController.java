package com.my.backend.controller;

import com.my.backend.dto.ReportDto;
import com.my.backend.service.ReportService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // 🔥 신고 생성 (세션 기반)
    @PostMapping
    public ResponseEntity<?> reportUser(@RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long reporterId = (Long) session.getAttribute("userId");
            if (reporterId == null) {
                return ResponseEntity.status(401).body("로그인이 필요합니다.");
            }

            Long targetId = Long.parseLong(body.get("targetId"));
            String reason = body.get("reason");

            ReportDto reportDto = reportService.createReport(reporterId, targetId, reason);
            return ResponseEntity.ok(reportDto);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 🔥 특정 유저에 대한 신고 조회 (관리자용)
    @GetMapping("/target/{targetId}")
    public ResponseEntity<?> getReports(@PathVariable Long targetId) {
        List<ReportDto> reports = reportService.getReportsByTarget(targetId);
        return ResponseEntity.ok(reports);
    }

    // 🔥 신고 상태 변경 (관리자용)
    @PatchMapping("/{reportId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long reportId, @RequestParam boolean status) {
        reportService.updateReportStatus(reportId, status);
        return ResponseEntity.ok("신고 상태가 변경되었습니다.");
    }

    // 🔥 마이페이지: 내가 신고한 내역 조회
    @GetMapping("/mypage")
    public ResponseEntity<?> getMyReports(HttpSession session) {
        Long reporterId = (Long) session.getAttribute("userId");
        if (reporterId == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }
        List<ReportDto> reports = reportService.getReportsByReporter(reporterId);
        return ResponseEntity.ok(reports);
    }

    // 관리자용 전체 신고 조회
    @GetMapping("/admin")
    public ResponseEntity<?> getAllReports() {
        List<ReportDto> reports = reportService.getAllReports();
        return ResponseEntity.ok(reports);
    }
}
