package com.techiefinder.repository.rating;

import com.techiefinder.model.rating.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByTechnicianId(Long technicianId);
    Optional<Rating> findByBookingId(Long bookingId);
    
    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.technician.id = :technicianId")
    Double getAverageRatingForTechnician(@Param("technicianId") Long technicianId);
}
