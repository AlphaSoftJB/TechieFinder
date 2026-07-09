package com.techiefinder.dto.admin;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class AdminStatsDto {
    private long totalUsers;
    private long totalCustomers;
    private long totalTechnicians;
    private long pendingTechnicianVerifications;
    private long totalBookings;
    private long pendingBookings;
    private long completedBookings;
    private long cancelledBookings;
    private BigDecimal totalRevenue;
    private long totalRatings;
    private Double averageRating;
}
