package com.techiefinder.service.admin;

import com.techiefinder.dto.admin.AdminStatsDto;
import com.techiefinder.model.booking.Booking;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.user.User;
import com.techiefinder.repository.booking.BookingRepository;
import com.techiefinder.repository.rating.RatingRepository;
import com.techiefinder.repository.technician.TechnicianRepository;
import com.techiefinder.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AdminStatsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RatingRepository ratingRepository;

    public AdminStatsDto getStats() {
        List<User> users = userRepository.findAll();
        List<Technician> technicians = technicianRepository.findAll();
        List<Booking> bookings = bookingRepository.findAll();

        AdminStatsDto stats = new AdminStatsDto();
        stats.setTotalUsers(users.size());
        stats.setTotalCustomers(users.stream().filter(u -> u.getRole() == User.UserRole.USER).count());
        stats.setTotalTechnicians(technicians.size());
        stats.setPendingTechnicianVerifications(technicians.stream()
                .filter(t -> t.getVerificationStatus() == Technician.VerificationStatus.PENDING)
                .count());

        stats.setTotalBookings(bookings.size());
        stats.setPendingBookings(bookings.stream().filter(b -> b.getStatus() == Booking.BookingStatus.PENDING).count());
        stats.setCompletedBookings(bookings.stream().filter(b -> b.getStatus() == Booking.BookingStatus.COMPLETED).count());
        stats.setCancelledBookings(bookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CANCELLED || b.getStatus() == Booking.BookingStatus.REJECTED)
                .count());

        BigDecimal totalRevenue = bookings.stream()
                .filter(b -> b.getPaymentStatus() == Booking.PaymentStatus.PAID)
                .map(b -> b.getFinalPrice() != null ? b.getFinalPrice() : b.getEstimatedPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setTotalRevenue(totalRevenue);

        stats.setTotalRatings(ratingRepository.count());
        java.util.OptionalDouble averageRating = technicians.stream()
                .filter(t -> t.getTotalRatings() != null && t.getTotalRatings() > 0 && t.getRating() != null)
                .mapToDouble(t -> t.getRating().doubleValue())
                .average();
        stats.setAverageRating(averageRating.isPresent() ? averageRating.getAsDouble() : null);

        return stats;
    }
}
