package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.TechnicianCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianCertificationRepository extends JpaRepository<TechnicianCertification, Long> {
    List<TechnicianCertification> findByTechnicianId(Long technicianId);
}
