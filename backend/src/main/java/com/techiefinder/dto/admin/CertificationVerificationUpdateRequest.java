package com.techiefinder.dto.admin;

import com.techiefinder.model.technician.TechnicianCertification;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CertificationVerificationUpdateRequest {
    @NotNull
    private TechnicianCertification.VerificationStatus status;
}
