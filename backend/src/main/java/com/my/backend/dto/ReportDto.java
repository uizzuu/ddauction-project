package com.my.backend.dto;

import com.my.backend.entity.Report;
import com.my.backend.entity.Users;
import com.my.backend.enums.ReportType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportDto {

    private Long reportId;
    private Long reporterId; // 신고한 사람
    private Long refId;      // 신고 대상 ID (상품, 리뷰, 사용자 등)
    private ReportType reportType;
    private String reason;
    private boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity → DTO
    public static ReportDto fromEntity(Report report) {
        if (report == null) return null;

        return ReportDto.builder()
                .reportId(report.getReportId())
                .reporterId(report.getUser() != null ? report.getUser().getUserId() : null)
                .refId(report.getRefId())
                .reportType(report.getReportType())
                .reason(report.getReason())
                .status(report.isStatus())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public Report toEntity(Users reporter) {
        return Report.builder()
                .reportId(this.reportId)
                .user(reporter)
                .refId(this.refId)
                .reportType(this.reportType)
                .reason(this.reason)
                .status(this.status)
                .build();
    }
}
