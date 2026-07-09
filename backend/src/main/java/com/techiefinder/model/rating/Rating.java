package com.techiefinder.model.rating;

import com.techiefinder.model.BaseEntity;
import com.techiefinder.model.booking.Booking;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ratings")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Rating extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "technician_id", nullable = false)
    private Technician technician;

    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Column(nullable = false)
    private Integer rating; // 1-5 stars

    @Column(length = 2000)
    private String review;

    private Integer professionalismRating; // 1-5
    private Integer qualityRating; // 1-5
    private Integer punctualityRating; // 1-5
    private Integer communicationRating; // 1-5

    @Column(length = 1000)
    private String technicianResponse;

    @Column(nullable = false)
    private Boolean verified = true; // Verified booking-based review
}
