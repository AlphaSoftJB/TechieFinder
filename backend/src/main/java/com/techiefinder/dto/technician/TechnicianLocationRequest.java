package com.techiefinder.dto.technician;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TechnicianLocationRequest {
    @NotBlank
    private String address;

    @NotBlank
    private String city;

    @NotBlank
    private String state;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    private Integer serviceRadiusKm;

    private String landmark;
}
