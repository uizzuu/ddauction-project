package com.my.backend.dto;

import com.my.backend.entity.Report;
import com.my.backend.entity.Users;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportDto {

    private Long reportId;
    private Long reporterId;
    private Long targetId;
    private String reason;
    private Boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity → DTO
    public static ReportDto fromEntity(Report report) {
        if (report == null) return null;

        return ReportDto.builder()
                .reportId(report.getReportId())
                .reporterId(report.getReporter() != null ? report.getReporter().getUserId() : null)
                .targetId(report.getTarget() != null ? report.getTarget().getUserId() : null)
                .reason(report.getReason())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public Report toEntity(Users reporter, Users target) {
        return Report.builder()
                .reportId(this.reportId)
                .reporter(reporter)
                .target(target)
                .reason(this.reason)
                .status(this.status)
                .build();
    }
}
