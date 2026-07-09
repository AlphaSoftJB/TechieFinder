package com.techiefinder.dto.technician;

import com.techiefinder.model.technician.TechnicianService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ServiceOfferingRequest {
    @NotBlank
    private String categorySlug;

    @NotBlank
    private String serviceName;

    private String description;

    @NotNull
    private BigDecimal basePrice;

    @NotNull
    private TechnicianService.PricingType pricingType;

    private Integer estimatedDurationMinutes;
}
