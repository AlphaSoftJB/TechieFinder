package com.techiefinder.service.technician;

import com.techiefinder.dto.technician.TechnicianCertificationDto;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.technician.TechnicianCertification;
import com.techiefinder.repository.technician.TechnicianCertificationRepository;
import com.techiefinder.repository.technician.TechnicianRepository;
import com.techiefinder.service.storage.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TechnicianCertificationService {

    @Autowired
    private TechnicianCertificationRepository certificationRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Transactional
    public TechnicianCertificationDto addCertification(Long userId, String name, String issuingOrganization,
                                                          String credentialId, LocalDate issueDate, LocalDate expiryDate,
                                                          MultipartFile certificateFile) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("This account has no technician profile yet"));

        String certificateUrl = certificateFile != null && !certificateFile.isEmpty()
                ? fileStorageService.storeDocument(certificateFile, "certifications")
                : null;

        TechnicianCertification certification = TechnicianCertification.builder()
                .technician(technician)
                .name(name)
                .issuingOrganization(issuingOrganization)
                .credentialId(credentialId)
                .issueDate(issueDate)
                .expiryDate(expiryDate)
                .certificateUrl(certificateUrl)
                .verificationStatus(TechnicianCertification.VerificationStatus.PENDING)
                .build();

        certification = certificationRepository.save(certification);
        return mapToDto(certification);
    }

    public List<TechnicianCertificationDto> getCertificationsForTechnician(Long technicianId) {
        return certificationRepository.findByTechnicianId(technicianId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteCertification(Long userId, Long certificationId) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("This account has no technician profile yet"));

        TechnicianCertification certification = certificationRepository.findById(certificationId)
                .orElseThrow(() -> new IllegalArgumentException("Certification not found"));

        if (!certification.getTechnician().getId().equals(technician.getId())) {
            throw new SecurityException("This certification does not belong to you");
        }

        certificationRepository.delete(certification);
        fileStorageService.delete(certification.getCertificateUrl());
    }

    public List<TechnicianCertificationDto> getAllCertifications() {
        return certificationRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TechnicianCertificationDto updateVerificationStatus(Long certificationId, TechnicianCertification.VerificationStatus status) {
        TechnicianCertification certification = certificationRepository.findById(certificationId)
                .orElseThrow(() -> new IllegalArgumentException("Certification not found"));
        certification.setVerificationStatus(status);
        certification = certificationRepository.save(certification);
        return mapToDto(certification);
    }

    private TechnicianCertificationDto mapToDto(TechnicianCertification certification) {
        TechnicianCertificationDto dto = new TechnicianCertificationDto();
        dto.setId(certification.getId());
        dto.setTechnicianId(certification.getTechnician().getId());
        dto.setName(certification.getName());
        dto.setIssuingOrganization(certification.getIssuingOrganization());
        dto.setCredentialId(certification.getCredentialId());
        dto.setIssueDate(certification.getIssueDate());
        dto.setExpiryDate(certification.getExpiryDate());
        dto.setCertificateUrl(certification.getCertificateUrl());
        dto.setVerificationStatus(certification.getVerificationStatus().name());
        return dto;
    }
}
