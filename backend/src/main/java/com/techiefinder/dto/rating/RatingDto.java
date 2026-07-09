package com.techiefinder.dto.rating;

import lombok.Data;

@Data
public class RatingDto {
    private Long id;
    private Long bookingId;
    private Long userId;
    private Long technicianId;
    private Integer rating;
    private String review;
    private Integer professionalismRating;
    private Integer qualityRating;
    private Integer punctualityRating;
    private Integer communicationRating;
    private String technicianResponse;
}
