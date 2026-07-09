package com.techiefinder.dto.technician;

import lombok.Data;

@Data
public class ServiceCategoryDto {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String iconUrl;
}
