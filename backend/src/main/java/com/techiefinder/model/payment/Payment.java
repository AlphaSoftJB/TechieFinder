package com.techiefinder.model.payment;

import com.techiefinder.model.BaseEntity;
import com.techiefinder.model.booking.Booking;
import com.techiefinder.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String transactionReference; // e.g., TXN-20240101-001234

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentType type;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentGateway gateway;

    private String gatewayReference; // Reference from payment gateway

    private String gatewayResponse; // JSON response from gateway

    private LocalDateTime paidAt;

    private String paymentMethod; // e.g., "card", "bank_transfer", "mobile_money"

    @Column(length = 1000)
    private String description;

    public enum PaymentType {
        BOOKING_PAYMENT,
        WALLET_TOPUP,
        WITHDRAWAL,
        REFUND
    }

    public enum PaymentStatus {
        PENDING,
        PROCESSING,
        SUCCESS,
        FAILED,
        CANCELLED,
        REFUNDED
    }

    public enum PaymentGateway {
        PAYSTACK,
        FLUTTERWAVE,
        WALLET
    }
}
