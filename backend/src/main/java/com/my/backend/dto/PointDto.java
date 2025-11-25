package com.my.backend.dto;

import com.my.backend.entity.Point;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PointDto {
    private Long pointId;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Point.PointStatus pointStatus;

    public static PointDto fromEntity(Point point) {
        if (point == null) {
            return null;
        }
        return PointDto.builder()
                .pointId(point.getPointId())
                .userId(point.getUser().getUserId())
                .createdAt(point.getCreatedAt())
                .updatedAt(point.getUpdatedAt())
                .pointStatus(point.getPointStatus())
                .build();
    }

    public Point toEntity(User user) {
        return Point.builder()
                .pointId(this.pointId)
                .user(user)
                .pointStatus(this.pointStatus)
                .build();
    }
}
