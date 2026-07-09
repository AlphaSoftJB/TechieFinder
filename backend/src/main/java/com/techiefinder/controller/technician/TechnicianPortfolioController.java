package com.techiefinder.controller.technician;

import com.techiefinder.dto.technician.TechnicianPortfolioDto;
import com.techiefinder.security.CustomUserDetails;
import com.techiefinder.service.technician.TechnicianPortfolioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/technicians")
public class TechnicianPortfolioController {

    @Autowired
    private TechnicianPortfolioService portfolioService;

    @PostMapping(value = "/me/portfolio", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<TechnicianPortfolioDto> addPortfolioItem(@AuthenticationPrincipal CustomUserDetails principal,
                                                                     @RequestParam String title,
                                                                     @RequestParam(required = false) String description,
                                                                     @RequestParam(required = false) String categorySlug,
                                                                     @RequestParam("image") MultipartFile image) {
        return ResponseEntity.ok(portfolioService.addPortfolioItem(principal.getId(), title, description, categorySlug, image));
    }

    @DeleteMapping("/me/portfolio/{itemId}")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<Void> deletePortfolioItem(@AuthenticationPrincipal CustomUserDetails principal, @PathVariable Long itemId) {
        portfolioService.deletePortfolioItem(principal.getId(), itemId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/portfolio")
    public ResponseEntity<List<TechnicianPortfolioDto>> getPortfolio(@PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.getPortfolioForTechnician(id));
    }
}
