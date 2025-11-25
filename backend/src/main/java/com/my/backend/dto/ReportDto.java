package com.my.backend.dto;

import com.my.backend.entity.Report;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportDto {
    private Long reportId;
    private Long reporterId;
    private Long targetId;
    private String reason;
    private boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReportDto fromEntity(Report report) {

        return ReportDto.builder()
                .reportId(report.getReportId())
                .reporterId(report.getReporterId().getUserId())
                .targetId(report.getTargetId().getUserId())
                .reason(report.getReason())
                .status(report.isStatus())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    public Report toEntity(User reporter, User target) {
        return Report.builder()
                .reportId(this.reportId)
                .reporterId(reporter)
                .targetId(target)
                .reason(this.reason)
                .status(this.status)
                .build();
    }
}
