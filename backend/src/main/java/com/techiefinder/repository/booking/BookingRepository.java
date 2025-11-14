package com.techiefinder.repository.booking;

import com.techiefinder.model.booking.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingNumber(String bookingNumber);
    List<Booking> findByUserId(Long userId);
    List<Booking> findByTechnicianId(Long technicianId);
    List<Booking> findByUserIdAndStatus(Long userId, Booking.BookingStatus status);
    List<Booking> findByTechnicianIdAndStatus(Long technicianId, Booking.BookingStatus status);
}
