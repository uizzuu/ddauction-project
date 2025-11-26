package com.my.backend.controller;

import com.my.backend.dto.ReportDto;
import com.my.backend.enums.ReportType;
import com.my.backend.myjwt.JWTUtil;
import com.my.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final JWTUtil jwtUtil;

    // 신고 생성 (JWT 기반)
    @PostMapping
    public ResponseEntity<?> reportUser(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody Map<String, Object> body
    ) {
        try {
            // Bearer 토큰에서 userId 추출
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }
            String token = authorizationHeader.substring(7);
            Long reporterId = jwtUtil.getUserId(token);

            Long refId = Long.parseLong(body.get("refId").toString());
            String reason = body.get("reason").toString();
            String reportTypeStr = body.get("reportType").toString();
            ReportType reportType = ReportType.valueOf(reportTypeStr);

            ReportDto reportDto = reportService.createReport(reporterId, refId, reason, reportType);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("message", "신고가 접수되었습니다.", "data", reportDto));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("잘못된 요청입니다: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("신고 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 특정 대상에 대한 신고 조회 (관리자용)
    @GetMapping("/target/{refId}")
    public ResponseEntity<List<ReportDto>> getReportsByTarget(@PathVariable Long refId) {
        List<ReportDto> reports = reportService.getReportsByTarget(refId);
        return ResponseEntity.ok(reports);
    }

    // 신고 타입별 조회 (관리자용)
    @GetMapping("/type/{reportType}")
    public ResponseEntity<List<ReportDto>> getReportsByType(@PathVariable ReportType reportType) {
        List<ReportDto> reports = reportService.getReportsByType(reportType);
        return ResponseEntity.ok(reports);
    }

    // 처리 상태별 조회 (관리자용)
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ReportDto>> getReportsByStatus(@PathVariable boolean status) {
        List<ReportDto> reports = reportService.getReportsByStatus(status);
        return ResponseEntity.ok(reports);
    }

    // 신고 상태 변경 (관리자용)
    @PatchMapping("/{reportId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long reportId,
            @RequestParam boolean status
    ) {
        reportService.updateReportStatus(reportId, status);
        return ResponseEntity.ok(Map.of("message", "신고 상태가 변경되었습니다."));
    }

    // 마이페이지: 내가 신고한 내역 조회
    @GetMapping("/mypage")
    public ResponseEntity<?> getMyReports(
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        try {
            if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
            }
            String token = authorizationHeader.substring(7);
            Long reporterId = jwtUtil.getUserId(token);

            List<ReportDto> reports = reportService.getReportsByReporter(reporterId);
            return ResponseEntity.ok(reports);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("내역 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 관리자용 전체 신고 조회
    @GetMapping("/admin")
    public ResponseEntity<List<ReportDto>> getAllReports() {
        List<ReportDto> reports = reportService.getAllReports();
        return ResponseEntity.ok(reports);
    }
}