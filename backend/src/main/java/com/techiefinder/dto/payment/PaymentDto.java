package com.techiefinder.dto.payment;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentDto {
    private Long id;
    private String transactionReference;
    private Long bookingId;
    private BigDecimal amount;
    private String type;
    private String status;
    private String gateway;
    private LocalDateTime paidAt;
}
