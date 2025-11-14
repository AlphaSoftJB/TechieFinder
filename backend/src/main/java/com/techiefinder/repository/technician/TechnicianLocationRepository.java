package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.TechnicianLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianLocationRepository extends JpaRepository<TechnicianLocation, Long> {
    Optional<TechnicianLocation> findByTechnicianId(Long technicianId);
    
    @Query(value = "SELECT * FROM technician_locations WHERE " +
           "(6371 * acos(cos(radians(:latitude)) * cos(radians(latitude)) * " +
           "cos(radians(longitude) - radians(:longitude)) + sin(radians(:latitude)) * " +
           "sin(radians(latitude)))) <= :radiusKm", nativeQuery = true)
    List<TechnicianLocation> findWithinRadius(
        @Param("latitude") Double latitude,
        @Param("longitude") Double longitude,
        @Param("radiusKm") Double radiusKm
    );
}
