package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.TechnicianPortfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianPortfolioRepository extends JpaRepository<TechnicianPortfolio, Long> {
    List<TechnicianPortfolio> findByTechnicianIdOrderByDisplayOrderAsc(Long technicianId);
}
