package com.techiefinder.controller.admin;

import com.techiefinder.dto.admin.AdminStatsDto;
import com.techiefinder.dto.admin.TechnicianVerificationUpdateRequest;
import com.techiefinder.dto.admin.UserStatusUpdateRequest;
import com.techiefinder.dto.booking.BookingDto;
import com.techiefinder.dto.rating.RatingDto;
import com.techiefinder.dto.technician.TechnicianDto;
import com.techiefinder.dto.user.UserDto;
import com.techiefinder.service.admin.AdminStatsService;
import com.techiefinder.service.booking.BookingService;
import com.techiefinder.service.rating.RatingService;
import com.techiefinder.service.technician.TechnicianAccountService;
import com.techiefinder.service.user.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * All routes here are already gated to ROLE_ADMIN in SecurityConfig
 * (/api/admin/**); the method-level @PreAuthorize is kept for defense in depth.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminStatsService adminStatsService;

    @Autowired
    private UserService userService;

    @Autowired
    private TechnicianAccountService technicianAccountService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private RatingService ratingService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminStatsService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<UserDto> setUserStatus(@PathVariable Long id, @Valid @RequestBody UserStatusUpdateRequest request) {
        return ResponseEntity.ok(userService.setActive(id, request.getActive()));
    }

    @GetMapping("/technicians")
    public ResponseEntity<List<TechnicianDto>> getAllTechnicians() {
        return ResponseEntity.ok(technicianAccountService.getAllTechnicians());
    }

    @PatchMapping("/technicians/{id}/verification")
    public ResponseEntity<TechnicianDto> setTechnicianVerification(@PathVariable Long id,
                                                                     @Valid @RequestBody TechnicianVerificationUpdateRequest request) {
        return ResponseEntity.ok(technicianAccountService.updateVerificationStatus(id, request.getStatus()));
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingDto>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/ratings")
    public ResponseEntity<List<RatingDto>> getAllRatings() {
        return ResponseEntity.ok(ratingService.getAllRatings());
    }

    @DeleteMapping("/ratings/{id}")
    public ResponseEntity<Void> deleteRating(@PathVariable Long id) {
        ratingService.deleteRating(id);
        return ResponseEntity.noContent().build();
    }
}
