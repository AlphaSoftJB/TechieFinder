package com.techiefinder.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BookingRequest {
    @NotNull
    private Long technicianId;
    
    @NotNull
    private LocalDateTime scheduledDateTime;
    
    @NotBlank
    private String serviceDescription;
    
    private String userNotes;
    
    @NotBlank
    private String serviceAddress;
    
    @NotBlank
    private String city;
    
    @NotBlank
    private String state;
    
    private Double latitude;
    private Double longitude;
    
    @NotNull
    private BigDecimal estimatedPrice;
}
