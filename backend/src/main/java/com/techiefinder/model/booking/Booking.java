package com.techiefinder.model.booking;

import com.techiefinder.model.BaseEntity;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String bookingNumber; // e.g., BK-20240101-001234

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "technician_id", nullable = false)
    private Technician technician;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime scheduledDateTime;

    private LocalDateTime completedDateTime;

    @Column(nullable = false)
    private String serviceDescription;

    @Column(length = 2000)
    private String userNotes;

    @Column(length = 2000)
    private String technicianNotes;

    @Column(nullable = false)
    private String serviceAddress;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String state;

    private Double latitude;
    private Double longitude;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedPrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal finalPrice;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    private String cancellationReason;

    private LocalDateTime cancelledAt;

    @ManyToOne
    @JoinColumn(name = "cancelled_by_user_id")
    private User cancelledBy;

    public enum BookingStatus {
        PENDING,
        CONFIRMED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        REJECTED
    }

    public enum PaymentStatus {
        PENDING,
        PAID,
        REFUNDED,
        FAILED
    }
}
