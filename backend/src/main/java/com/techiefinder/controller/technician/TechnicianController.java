package com.techiefinder.controller.technician;

import com.techiefinder.dto.technician.ServiceOfferingDto;
import com.techiefinder.dto.technician.ServiceOfferingRequest;
import com.techiefinder.dto.technician.TechnicianDto;
import com.techiefinder.dto.technician.TechnicianLocationDto;
import com.techiefinder.dto.technician.TechnicianLocationRequest;
import com.techiefinder.security.CustomUserDetails;
import com.techiefinder.service.technician.ServiceOfferingService;
import com.techiefinder.service.technician.TechnicianAccountService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technicians")
public class TechnicianController {

    @Autowired
    private TechnicianAccountService technicianAccountService;

    @Autowired
    private ServiceOfferingService serviceOfferingService;

    @PostMapping("/create/{userId}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<TechnicianDto> createTechnician(@PathVariable Long userId) {
        return ResponseEntity.ok(technicianAccountService.createTechnician(userId));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<TechnicianDto> getMyProfile(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(technicianAccountService.getMyProfile(principal.getId()));
    }

    @PutMapping("/me/location")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<TechnicianLocationDto> updateMyLocation(@AuthenticationPrincipal CustomUserDetails principal,
                                                                    @Valid @RequestBody TechnicianLocationRequest request) {
        return ResponseEntity.ok(technicianAccountService.upsertMyLocation(principal.getId(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TechnicianDto> getTechnicianById(@PathVariable Long id) {
        return ResponseEntity.ok(technicianAccountService.getTechnicianById(id));
    }

    @GetMapping("/available")
    public ResponseEntity<List<TechnicianDto>> getAvailableTechnicians(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(technicianAccountService.searchAvailableTechnicians(category));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<TechnicianDto>> getNearbyTechnicians(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "15") Double radiusKm) {
        return ResponseEntity.ok(technicianAccountService.findNearby(latitude, longitude, radiusKm));
    }

    @PostMapping("/me/services")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ServiceOfferingDto> addMyServiceOffering(@AuthenticationPrincipal CustomUserDetails principal,
                                                                     @Valid @RequestBody ServiceOfferingRequest request) {
        return ResponseEntity.ok(serviceOfferingService.addOffering(principal.getId(), request));
    }

    @GetMapping("/me/services")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<ServiceOfferingDto>> getMyServiceOfferings(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(serviceOfferingService.getMyOfferings(principal.getId()));
    }

    @GetMapping("/{id}/services")
    public ResponseEntity<List<ServiceOfferingDto>> getServiceOfferings(@PathVariable Long id) {
        return ResponseEntity.ok(serviceOfferingService.getOfferingsForTechnician(id));
    }
}
