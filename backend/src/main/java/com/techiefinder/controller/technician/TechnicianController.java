package com.techiefinder.controller.technician;

import com.techiefinder.dto.technician.TechnicianDto;
import com.techiefinder.service.technician.TechnicianAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technicians")
public class TechnicianController {

    @Autowired
    private TechnicianAccountService technicianAccountService;

    @PostMapping("/create/{userId}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<TechnicianDto> createTechnician(@PathVariable Long userId) {
        return ResponseEntity.ok(technicianAccountService.createTechnician(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TechnicianDto> getTechnicianById(@PathVariable Long id) {
        return ResponseEntity.ok(technicianAccountService.getTechnicianById(id));
    }

    @GetMapping("/available")
    public ResponseEntity<List<TechnicianDto>> getAllAvailableTechnicians() {
        return ResponseEntity.ok(technicianAccountService.getAllAvailableTechnicians());
    }
}
