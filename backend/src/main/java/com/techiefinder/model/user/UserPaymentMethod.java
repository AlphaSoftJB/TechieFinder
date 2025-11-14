package com.techiefinder.model.user;

import com.techiefinder.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_payment_methods")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPaymentMethod extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentType type;

    private String cardLast4; // Last 4 digits of card
    private String cardBrand; // Visa, Mastercard, etc.
    private String cardExpiryMonth;
    private String cardExpiryYear;

    private String bankName;
    private String accountNumber;
    private String accountName;

    private String mobileMoneyProvider; // MTN, Airtel, etc.
    private String mobileMoneyNumber;

    @Column(nullable = false)
    private Boolean isDefault = false;

    // Payment gateway authorization code (for recurring payments)
    private String authorizationCode;
    private String paymentGateway; // PAYSTACK or FLUTTERWAVE

    public enum PaymentType {
        CARD,
        BANK_ACCOUNT,
        MOBILE_MONEY,
        WALLET
    }
}
