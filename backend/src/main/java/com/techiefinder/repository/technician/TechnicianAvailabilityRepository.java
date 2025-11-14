package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.TechnicianAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface TechnicianAvailabilityRepository extends JpaRepository<TechnicianAvailability, Long> {
    List<TechnicianAvailability> findByTechnicianId(Long technicianId);
    List<TechnicianAvailability> findByTechnicianIdAndDayOfWeek(Long technicianId, DayOfWeek dayOfWeek);
}
