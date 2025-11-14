package com.techiefinder.dto.booking;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BookingDto {
    private Long id;
    private String bookingNumber;
    private Long userId;
    private Long technicianId;
    private String status;
    private LocalDateTime scheduledDateTime;
    private String serviceDescription;
    private String serviceAddress;
    private BigDecimal estimatedPrice;
    private BigDecimal finalPrice;
    private String paymentStatus;
}
