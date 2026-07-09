package com.techiefinder.service.technician;

import com.techiefinder.dto.technician.ServiceOfferingDto;
import com.techiefinder.dto.technician.ServiceOfferingRequest;
import com.techiefinder.model.technician.ServiceCategory;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.technician.TechnicianService;
import com.techiefinder.repository.technician.ServiceCategoryRepository;
import com.techiefinder.repository.technician.TechnicianRepository;
import com.techiefinder.repository.technician.TechnicianServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServiceOfferingService {

    @Autowired
    private TechnicianServiceRepository technicianServiceRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Transactional
    public ServiceOfferingDto addOffering(Long userId, ServiceOfferingRequest request) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("This account has no technician profile yet"));

        ServiceCategory category = serviceCategoryRepository.findBySlug(request.getCategorySlug())
                .orElseThrow(() -> new IllegalArgumentException("Unknown service category: " + request.getCategorySlug()));

        TechnicianService offering = TechnicianService.builder()
                .technician(technician)
                .category(category)
                .serviceName(request.getServiceName())
                .description(request.getDescription())
                .basePrice(request.getBasePrice())
                .pricingType(request.getPricingType())
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes())
                .available(true)
                .build();

        offering = technicianServiceRepository.save(offering);
        return mapToDto(offering);
    }

    public List<ServiceOfferingDto> getOfferingsForTechnician(Long technicianId) {
        return technicianServiceRepository.findByTechnicianId(technicianId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ServiceOfferingDto> getMyOfferings(Long userId) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("This account has no technician profile yet"));
        return getOfferingsForTechnician(technician.getId());
    }

    private ServiceOfferingDto mapToDto(TechnicianService offering) {
        ServiceOfferingDto dto = new ServiceOfferingDto();
        dto.setId(offering.getId());
        dto.setTechnicianId(offering.getTechnician().getId());
        dto.setCategoryName(offering.getCategory().getName());
        dto.setCategorySlug(offering.getCategory().getSlug());
        dto.setServiceName(offering.getServiceName());
        dto.setDescription(offering.getDescription());
        dto.setBasePrice(offering.getBasePrice());
        dto.setPricingType(offering.getPricingType().name());
        dto.setEstimatedDurationMinutes(offering.getEstimatedDurationMinutes());
        dto.setAvailable(offering.getAvailable());
        return dto;
    }
}
