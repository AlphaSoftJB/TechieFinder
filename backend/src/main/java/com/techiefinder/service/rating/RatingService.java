package com.techiefinder.service.rating;

import com.techiefinder.dto.rating.RatingDto;
import com.techiefinder.dto.rating.RatingRequest;
import com.techiefinder.model.booking.Booking;
import com.techiefinder.model.notification.Notification;
import com.techiefinder.model.rating.Rating;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.repository.booking.BookingRepository;
import com.techiefinder.repository.rating.RatingRepository;
import com.techiefinder.repository.technician.TechnicianRepository;
import com.techiefinder.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RatingService {

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public RatingDto rateBooking(Long userId, RatingRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new SecurityException("This booking does not belong to you");
        }
        if (booking.getStatus() != Booking.BookingStatus.COMPLETED) {
            throw new IllegalStateException("Only completed bookings can be rated");
        }
        if (ratingRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new IllegalStateException("This booking has already been rated");
        }

        Rating rating = Rating.builder()
                .user(booking.getUser())
                .technician(booking.getTechnician())
                .booking(booking)
                .rating(request.getRating())
                .review(request.getReview())
                .professionalismRating(request.getProfessionalismRating())
                .qualityRating(request.getQualityRating())
                .punctualityRating(request.getPunctualityRating())
                .communicationRating(request.getCommunicationRating())
                .verified(true)
                .build();

        rating = ratingRepository.save(rating);

        recalculateTechnicianRating(booking.getTechnician());

        notificationService.notify(booking.getTechnician().getUser(), Notification.NotificationType.NEW_RATING,
                "New rating received",
                "You received a " + request.getRating() + "-star rating on booking #" + booking.getBookingNumber(),
                "/technicians/" + booking.getTechnician().getId() + "/ratings");

        return mapToDto(rating);
    }

    public List<RatingDto> getTechnicianRatings(Long technicianId) {
        return ratingRepository.findByTechnicianId(technicianId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<RatingDto> getAllRatings() {
        return ratingRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteRating(Long id) {
        Rating rating = ratingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rating not found"));
        Technician technician = rating.getTechnician();
        ratingRepository.delete(rating);
        recalculateTechnicianRating(technician);
    }

    private void recalculateTechnicianRating(Technician technician) {
        Double average = ratingRepository.getAverageRatingForTechnician(technician.getId());
        long totalRatings = ratingRepository.findByTechnicianId(technician.getId()).size();

        technician.setRating(average == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP));
        technician.setTotalRatings((int) totalRatings);
        technicianRepository.save(technician);
    }

    private RatingDto mapToDto(Rating rating) {
        RatingDto dto = new RatingDto();
        dto.setId(rating.getId());
        dto.setBookingId(rating.getBooking().getId());
        dto.setUserId(rating.getUser().getId());
        dto.setTechnicianId(rating.getTechnician().getId());
        dto.setCustomerName(rating.getUser().getFirstName() + " " + rating.getUser().getLastName());
        dto.setTechnicianName(rating.getTechnician().getUser().getFirstName() + " " + rating.getTechnician().getUser().getLastName());
        dto.setRating(rating.getRating());
        dto.setReview(rating.getReview());
        dto.setProfessionalismRating(rating.getProfessionalismRating());
        dto.setQualityRating(rating.getQualityRating());
        dto.setPunctualityRating(rating.getPunctualityRating());
        dto.setCommunicationRating(rating.getCommunicationRating());
        dto.setTechnicianResponse(rating.getTechnicianResponse());
        return dto;
    }
}
