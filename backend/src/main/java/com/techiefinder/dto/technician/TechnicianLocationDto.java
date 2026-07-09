package com.techiefinder.dto.technician;

import lombok.Data;

@Data
public class TechnicianLocationDto {
    private String address;
    private String city;
    private String state;
    private String country;
    private Double latitude;
    private Double longitude;
    private Integer serviceRadiusKm;
    private String landmark;
}
