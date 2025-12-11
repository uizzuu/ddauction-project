package com.my.backend.ban;
import com.my.backend.entity.Users;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_ban")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class UserBan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "banned_by", nullable = false)
    private Users bannedBy; // 어떤 관리자가 제재했는지

    @Column(nullable = false)
    private LocalDateTime banUntil; // 정지 해제 시각

    @Column(nullable = true, length = 500)
    private String reason; // 정지 이유

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true; // 현재 정지 상태

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 제재가 만료되었는지 확인
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(banUntil);
    }
}