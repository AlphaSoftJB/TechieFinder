package com.techiefinder.dto.admin;

import com.techiefinder.model.technician.Technician;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TechnicianVerificationUpdateRequest {
    @NotNull
    private Technician.VerificationStatus status;
}
