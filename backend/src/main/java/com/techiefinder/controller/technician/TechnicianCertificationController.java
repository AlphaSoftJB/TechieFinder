package com.techiefinder.controller.technician;

import com.techiefinder.dto.technician.TechnicianCertificationDto;
import com.techiefinder.security.CustomUserDetails;
import com.techiefinder.service.technician.TechnicianCertificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/technicians")
public class TechnicianCertificationController {

    @Autowired
    private TechnicianCertificationService certificationService;

    @PostMapping(value = "/me/certifications", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<TechnicianCertificationDto> addCertification(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam String name,
            @RequestParam String issuingOrganization,
            @RequestParam(required = false) String credentialId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate issueDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiryDate,
            @RequestParam(value = "certificateFile", required = false) MultipartFile certificateFile) {
        return ResponseEntity.ok(certificationService.addCertification(
                principal.getId(), name, issuingOrganization, credentialId, issueDate, expiryDate, certificateFile));
    }

    @DeleteMapping("/me/certifications/{certificationId}")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<Void> deleteCertification(@AuthenticationPrincipal CustomUserDetails principal,
                                                      @PathVariable Long certificationId) {
        certificationService.deleteCertification(principal.getId(), certificationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/certifications")
    public ResponseEntity<List<TechnicianCertificationDto>> getCertifications(@PathVariable Long id) {
        return ResponseEntity.ok(certificationService.getCertificationsForTechnician(id));
    }
}
