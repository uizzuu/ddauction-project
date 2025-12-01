package com.my.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "private_chat")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class PrivateChat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long privateChatId;

    @Column(nullable = false)
    private String content;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Users user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_room_id")
    private ChatRoom chatRoom;

}
