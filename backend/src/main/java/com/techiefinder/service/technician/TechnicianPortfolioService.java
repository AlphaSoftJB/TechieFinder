package com.techiefinder.service.technician;

import com.techiefinder.dto.technician.TechnicianPortfolioDto;
import com.techiefinder.model.technician.ServiceCategory;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.technician.TechnicianPortfolio;
import com.techiefinder.repository.technician.ServiceCategoryRepository;
import com.techiefinder.repository.technician.TechnicianPortfolioRepository;
import com.techiefinder.repository.technician.TechnicianRepository;
import com.techiefinder.service.storage.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TechnicianPortfolioService {

    @Autowired
    private TechnicianPortfolioRepository portfolioRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Transactional
    public TechnicianPortfolioDto addPortfolioItem(Long userId, String title, String description,
                                                     String categorySlug, MultipartFile image) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("This account has no technician profile yet"));

        String imageUrl = fileStorageService.storeImage(image, "portfolio");

        ServiceCategory category = StringUtils.hasText(categorySlug)
                ? serviceCategoryRepository.findBySlug(categorySlug).orElse(null)
                : null;

        int nextOrder = portfolioRepository.findByTechnicianIdOrderByDisplayOrderAsc(technician.getId()).size();

        TechnicianPortfolio item = TechnicianPortfolio.builder()
                .technician(technician)
                .title(title)
                .description(description)
                .imageUrl(imageUrl)
                .category(category)
                .displayOrder(nextOrder)
                .build();

        item = portfolioRepository.save(item);
        return mapToDto(item);
    }

    public List<TechnicianPortfolioDto> getPortfolioForTechnician(Long technicianId) {
        return portfolioRepository.findByTechnicianIdOrderByDisplayOrderAsc(technicianId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deletePortfolioItem(Long userId, Long itemId) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("This account has no technician profile yet"));

        TechnicianPortfolio item = portfolioRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio item not found"));

        if (!item.getTechnician().getId().equals(technician.getId())) {
            throw new SecurityException("This portfolio item does not belong to you");
        }

        portfolioRepository.delete(item);
        fileStorageService.delete(item.getImageUrl());
    }

    private TechnicianPortfolioDto mapToDto(TechnicianPortfolio item) {
        TechnicianPortfolioDto dto = new TechnicianPortfolioDto();
        dto.setId(item.getId());
        dto.setTechnicianId(item.getTechnician().getId());
        dto.setTitle(item.getTitle());
        dto.setDescription(item.getDescription());
        dto.setImageUrl(item.getImageUrl());
        dto.setCategoryName(item.getCategory() != null ? item.getCategory().getName() : null);
        dto.setDisplayOrder(item.getDisplayOrder());
        return dto;
    }
}
