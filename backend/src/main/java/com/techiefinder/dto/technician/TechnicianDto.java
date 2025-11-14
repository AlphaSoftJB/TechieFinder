package com.techiefinder.dto.technician;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TechnicianDto {
    private Long id;
    private String technicianId;
    private String verificationStatus;
    private Boolean available;
    private Boolean acceptingJobs;
    private BigDecimal rating;
    private Integer totalRatings;
    private Integer completedJobs;
    private String businessName;
    private String bio;
    private Integer yearsOfExperience;
}
