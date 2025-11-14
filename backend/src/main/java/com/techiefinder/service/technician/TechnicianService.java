package com.techiefinder.service.technician;

import com.techiefinder.dto.technician.TechnicianDto;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.user.User;
import com.techiefinder.repository.technician.TechnicianRepository;
import com.techiefinder.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TechnicianService {

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public TechnicianDto createTechnician(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.UserRole.TECHNICIAN) {
            throw new RuntimeException("User is not a technician");
        }

        Technician technician = Technician.builder()
                .user(user)
                .technicianId("TF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .verificationStatus(Technician.VerificationStatus.PENDING)
                .available(true)
                .acceptingJobs(true)
                .rating(BigDecimal.ZERO)
                .totalRatings(0)
                .completedJobs(0)
                .cancelledJobs(0)
                .walletBalance(BigDecimal.ZERO)
                .build();

        technician = technicianRepository.save(technician);
        return mapToDto(technician);
    }

    public TechnicianDto getTechnicianById(Long id) {
        Technician technician = technicianRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Technician not found"));
        return mapToDto(technician);
    }

    public List<TechnicianDto> getAllAvailableTechnicians() {
        return technicianRepository.findAvailableTechnicians()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private TechnicianDto mapToDto(Technician technician) {
        TechnicianDto dto = new TechnicianDto();
        dto.setId(technician.getId());
        dto.setTechnicianId(technician.getTechnicianId());
        dto.setVerificationStatus(technician.getVerificationStatus().name());
        dto.setAvailable(technician.getAvailable());
        dto.setAcceptingJobs(technician.getAcceptingJobs());
        dto.setRating(technician.getRating());
        dto.setTotalRatings(technician.getTotalRatings());
        dto.setCompletedJobs(technician.getCompletedJobs());
        dto.setBusinessName(technician.getBusinessName());
        dto.setBio(technician.getBio());
        dto.setYearsOfExperience(technician.getYearsOfExperience());
        return dto;
    }
}
