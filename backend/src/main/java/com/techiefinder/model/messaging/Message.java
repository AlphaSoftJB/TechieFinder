package com.techiefinder.model.messaging;

import com.techiefinder.model.BaseEntity;
import com.techiefinder.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, length = 5000)
    private String content;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MessageType type = MessageType.TEXT;

    private String attachmentUrl;

    @Column(nullable = false)
    private Boolean read = false;

    private LocalDateTime readAt;

    public enum MessageType {
        TEXT,
        IMAGE,
        FILE,
        LOCATION
    }
}
