package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.Technician;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianRepository extends JpaRepository<Technician, Long> {
    Optional<Technician> findByUserId(Long userId);
    Optional<Technician> findByTechnicianId(String technicianId);
    List<Technician> findByVerificationStatus(Technician.VerificationStatus status);
    List<Technician> findByAvailableTrue();
    
    @Query("SELECT t FROM Technician t WHERE t.available = true AND t.acceptingJobs = true")
    List<Technician> findAvailableTechnicians();
}
