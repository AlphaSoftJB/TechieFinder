package com.techiefinder.model.notification;

import com.techiefinder.model.BaseEntity;
import com.techiefinder.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(length = 2000)
    private String data; // JSON data for additional information

    @Column(nullable = false)
    private Boolean read = false;

    private LocalDateTime readAt;

    private String actionUrl; // Deep link or URL for action

    @Column(nullable = false)
    private Boolean sentViaPush = false;

    @Column(nullable = false)
    private Boolean sentViaEmail = false;

    @Column(nullable = false)
    private Boolean sentViaSms = false;

    public enum NotificationType {
        BOOKING_CREATED,
        BOOKING_CONFIRMED,
        BOOKING_CANCELLED,
        BOOKING_COMPLETED,
        PAYMENT_RECEIVED,
        PAYMENT_FAILED,
        NEW_MESSAGE,
        NEW_RATING,
        TECHNICIAN_VERIFIED,
        PROMOTION,
        SYSTEM_ANNOUNCEMENT
    }
}
