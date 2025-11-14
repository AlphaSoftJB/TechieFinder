package com.techiefinder.controller.publicapi;

import com.techiefinder.dto.technician.ServiceCategoryDto;
import com.techiefinder.model.technician.ServiceCategory;
import com.techiefinder.repository.technician.ServiceCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PublicController {

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("TechieFinder API is running");
    }

    @GetMapping("/categories")
    public ResponseEntity<List<ServiceCategoryDto>> getAllCategories() {
        List<ServiceCategoryDto> categories = serviceCategoryRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    private ServiceCategoryDto mapToDto(ServiceCategory category) {
        ServiceCategoryDto dto = new ServiceCategoryDto();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setSlug(category.getSlug());
        dto.setDescription(category.getDescription());
        dto.setIconUrl(category.getIconUrl());
        return dto;
    }
}
