package com.techiefinder.dto.rating;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RatingRequest {
    @NotNull
    private Long bookingId;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer rating;

    private String review;

    @Min(1)
    @Max(5)
    private Integer professionalismRating;

    @Min(1)
    @Max(5)
    private Integer qualityRating;

    @Min(1)
    @Max(5)
    private Integer punctualityRating;

    @Min(1)
    @Max(5)
    private Integer communicationRating;
}
