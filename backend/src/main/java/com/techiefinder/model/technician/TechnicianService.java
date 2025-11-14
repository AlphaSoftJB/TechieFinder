package com.techiefinder.model.technician;

import com.techiefinder.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "technician_services")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianService extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "technician_id", nullable = false)
    private Technician technician;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private ServiceCategory category;

    @Column(nullable = false)
    private String serviceName;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PricingType pricingType;

    private Integer estimatedDurationMinutes;

    @Column(nullable = false)
    private Boolean available = true;

    public enum PricingType {
        FIXED,
        HOURLY,
        NEGOTIABLE
    }
}
