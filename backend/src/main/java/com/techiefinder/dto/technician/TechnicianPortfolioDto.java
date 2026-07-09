package com.techiefinder.dto.technician;

import lombok.Data;

@Data
public class TechnicianPortfolioDto {
    private Long id;
    private Long technicianId;
    private String title;
    private String description;
    private String imageUrl;
    private String categoryName;
    private Integer displayOrder;
}
