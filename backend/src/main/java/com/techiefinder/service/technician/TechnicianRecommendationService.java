package com.techiefinder.service.technician;

import com.techiefinder.dto.technician.TechnicianDto;
import com.techiefinder.model.booking.Booking;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.technician.TechnicianLocation;
import com.techiefinder.repository.booking.BookingRepository;
import com.techiefinder.repository.technician.TechnicianLocationRepository;
import com.techiefinder.repository.technician.TechnicianRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * "Recommended for you" -- a transparent, explainable weighted-score ranking,
 * not a call to an external ML/LLM API (this backend has no LLM key
 * configured). Ranks available technicians by:
 *   - rating (0-5, weighted highest -- the strongest quality signal we have)
 *   - completion rate (completed vs. completed+cancelled jobs)
 *   - proximity, if the caller supplies a location (closer is better, capped at 50km)
 *   - category match with the caller's past bookings, if authenticated
 *   - verification status (a small boost for admin-verified technicians)
 * Each technician's score is returned on the DTO so the ranking is inspectable,
 * not a black box.
 */
@Service
public class TechnicianRecommendationService {

    private static final double MAX_RELEVANT_DISTANCE_KM = 50.0;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private TechnicianLocationRepository technicianLocationRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<TechnicianDto> recommend(Long userId, Double latitude, Double longitude, int limit) {
        List<Technician> candidates = technicianRepository.findAvailableTechnicians();
        Set<Long> preferredCategoryIds = userId != null ? preferredCategoryIdsFor(userId) : Set.of();
        Map<Long, Double> distanceByTechnicianId = latitude != null && longitude != null
                ? distancesFromCaller(latitude, longitude)
                : Map.of();

        return candidates.stream()
                .map(t -> mapToDto(t, score(t, distanceByTechnicianId.get(t.getId()), preferredCategoryIds)))
                .sorted(Comparator.comparingDouble(TechnicianDto::getMatchScore).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    private Set<Long> preferredCategoryIdsFor(Long userId) {
        return bookingRepository.findByUserId(userId).stream()
                .flatMap(booking -> booking.getTechnician().getServices().stream())
                .map(service -> service.getCategory().getId())
                .collect(Collectors.toSet());
    }

    private Map<Long, Double> distancesFromCaller(double latitude, double longitude) {
        Map<Long, Double> distances = new HashMap<>();
        for (TechnicianLocation location : technicianLocationRepository.findAll()) {
            distances.put(location.getTechnician().getId(),
                    haversineKm(latitude, longitude, location.getLatitude(), location.getLongitude()));
        }
        return distances;
    }

    private double score(Technician technician, Double distanceKm, Set<Long> preferredCategoryIds) {
        double ratingScore = technician.getRating() != null ? technician.getRating().doubleValue() : 0.0;

        int completed = technician.getCompletedJobs() != null ? technician.getCompletedJobs() : 0;
        int cancelled = technician.getCancelledJobs() != null ? technician.getCancelledJobs() : 0;
        double completionRate = (completed + cancelled) > 0 ? (double) completed / (completed + cancelled) : 0.5;

        double proximityScore = distanceKm != null
                ? Math.max(0, 1 - (distanceKm / MAX_RELEVANT_DISTANCE_KM))
                : 0.0;

        boolean matchesPreferredCategory = technician.getServices().stream()
                .anyMatch(service -> preferredCategoryIds.contains(service.getCategory().getId()));

        boolean verified = technician.getVerificationStatus() == Technician.VerificationStatus.VERIFIED;

        return ratingScore * 2.0
                + completionRate * 3.0
                + proximityScore * 2.0
                + (matchesPreferredCategory ? 2.0 : 0.0)
                + (verified ? 1.0 : 0.0);
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private TechnicianDto mapToDto(Technician technician, double matchScore) {
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
        dto.setMatchScore(Math.round(matchScore * 100.0) / 100.0);
        return dto;
    }
}
