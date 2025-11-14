package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.TechnicianService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianServiceRepository extends JpaRepository<TechnicianService, Long> {
    List<TechnicianService> findByTechnicianId(Long technicianId);
    List<TechnicianService> findByCategoryId(Long categoryId);
}
