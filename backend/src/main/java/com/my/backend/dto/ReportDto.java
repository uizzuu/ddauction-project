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
    private Long userId;           // 신고자 ID
    private String userName;       // 신고자 이름
    private Long refId;            // 신고 대상 ID (상품/게시글/댓글 등)
    private ReportType reportType; // 신고 타입
    private String reason;
    private String answer; // 답변 추가
    private boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity → DTO
    public static ReportDto fromEntity(Report report) {
        if (report == null) return null;

        return ReportDto.builder()
                .reportId(report.getReportId())
                .userId(report.getUser() != null ? report.getUser().getUserId() : null)
                .userName(report.getUser() != null ? report.getUser().getUserName() : null)
                .refId(report.getRefId())
                .reportType(report.getReportType())
                .reason(report.getReason())
                .answer(report.getAnswer())
                .status(report.isStatus())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    // DTO → Entity
    public Report toEntity(Users user) {
        return Report.builder()
                .reportId(this.reportId)
                .user(user)
                .refId(this.refId)
                .reportType(this.reportType)
                .reason(this.reason)
                .answer(this.answer)
                .status(this.status)
                .build();
    }
}