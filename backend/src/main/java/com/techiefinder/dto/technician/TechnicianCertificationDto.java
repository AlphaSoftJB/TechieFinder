package com.techiefinder.dto.technician;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TechnicianCertificationDto {
    private Long id;
    private Long technicianId;
    private String name;
    private String issuingOrganization;
    private String credentialId;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String certificateUrl;
    private String verificationStatus;
}
