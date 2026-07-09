package com.techiefinder.service.technician;

import com.techiefinder.dto.technician.TechnicianDto;
import com.techiefinder.dto.technician.TechnicianLocationDto;
import com.techiefinder.dto.technician.TechnicianLocationRequest;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.technician.TechnicianLocation;
import com.techiefinder.model.user.User;
import com.techiefinder.repository.technician.TechnicianLocationRepository;
import com.techiefinder.repository.technician.TechnicianRepository;
import com.techiefinder.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TechnicianAccountService {

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private TechnicianLocationRepository technicianLocationRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public TechnicianDto createTechnician(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRole() != User.UserRole.TECHNICIAN) {
            throw new IllegalStateException("User is not a technician");
        }

        technicianRepository.findByUserId(userId).ifPresent(existing -> {
            throw new IllegalStateException("This user already has a technician profile");
        });

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
                .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        return mapToDto(technician);
    }

    public TechnicianDto getMyProfile(Long userId) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("This account has no technician profile yet"));
        return mapToDto(technician);
    }

    public List<TechnicianDto> getAllAvailableTechnicians() {
        return technicianRepository.findAvailableTechnicians()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<TechnicianDto> searchAvailableTechnicians(String categorySlug) {
        List<Technician> technicians = StringUtils.hasText(categorySlug)
                ? technicianRepository.findAvailableByCategorySlug(categorySlug)
                : technicianRepository.findAvailableTechnicians();
        return technicians.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<TechnicianDto> findNearby(Double latitude, Double longitude, Double radiusKm) {
        return technicianLocationRepository.findWithinRadius(latitude, longitude, radiusKm)
                .stream()
                .map(TechnicianLocation::getTechnician)
                .filter(t -> Boolean.TRUE.equals(t.getAvailable()) && Boolean.TRUE.equals(t.getAcceptingJobs()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TechnicianLocationDto upsertMyLocation(Long userId, TechnicianLocationRequest request) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("This account has no technician profile yet"));

        TechnicianLocation location = technicianLocationRepository.findByTechnicianId(technician.getId())
                .orElseGet(() -> TechnicianLocation.builder().technician(technician).build());

        location.setAddress(request.getAddress());
        location.setCity(request.getCity());
        location.setState(request.getState());
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        if (request.getServiceRadiusKm() != null) {
            location.setServiceRadiusKm(request.getServiceRadiusKm());
        }
        location.setLandmark(request.getLandmark());

        location = technicianLocationRepository.save(location);
        return mapLocationToDto(location);
    }

    private TechnicianDto mapToDto(Technician technician) {
        TechnicianDto dto = new TechnicianDto();
        dto.setId(technician.getId());
        dto.setTechnicianId(technician.getTechnicianId());
        dto.setFirstName(technician.getUser().getFirstName());
        dto.setLastName(technician.getUser().getLastName());
        dto.setVerificationStatus(technician.getVerificationStatus().name());
        dto.setVerified(technician.getVerificationStatus() == Technician.VerificationStatus.VERIFIED);
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

    private TechnicianLocationDto mapLocationToDto(TechnicianLocation location) {
        TechnicianLocationDto dto = new TechnicianLocationDto();
        dto.setAddress(location.getAddress());
        dto.setCity(location.getCity());
        dto.setState(location.getState());
        dto.setCountry(location.getCountry());
        dto.setLatitude(location.getLatitude());
        dto.setLongitude(location.getLongitude());
        dto.setServiceRadiusKm(location.getServiceRadiusKm());
        dto.setLandmark(location.getLandmark());
        return dto;
    }
}
