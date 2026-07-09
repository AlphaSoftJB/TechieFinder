package com.techiefinder.dto.technician;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ServiceOfferingDto {
    private Long id;
    private Long technicianId;
    private String categoryName;
    private String categorySlug;
    private String serviceName;
    private String description;
    private BigDecimal basePrice;
    private String pricingType;
    private Integer estimatedDurationMinutes;
    private Boolean available;
}
