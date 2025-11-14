package com.techiefinder.controller.technician;

import com.techiefinder.dto.technician.TechnicianDto;
import com.techiefinder.service.technician.TechnicianService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technicians")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TechnicianController {

    @Autowired
    private TechnicianService technicianService;

    @PostMapping("/create/{userId}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<TechnicianDto> createTechnician(@PathVariable Long userId) {
        return ResponseEntity.ok(technicianService.createTechnician(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TechnicianDto> getTechnicianById(@PathVariable Long id) {
        return ResponseEntity.ok(technicianService.getTechnicianById(id));
    }

    @GetMapping("/available")
    public ResponseEntity<List<TechnicianDto>> getAllAvailableTechnicians() {
        return ResponseEntity.ok(technicianService.getAllAvailableTechnicians());
    }
}
