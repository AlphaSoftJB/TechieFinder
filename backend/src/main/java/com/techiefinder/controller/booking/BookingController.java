package com.techiefinder.controller.booking;

import com.techiefinder.dto.booking.BookingDto;
import com.techiefinder.dto.booking.BookingRequest;
import com.techiefinder.dto.booking.BookingStatusUpdateRequest;
import com.techiefinder.security.CustomUserDetails;
import com.techiefinder.service.booking.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingDto> createBooking(@AuthenticationPrincipal CustomUserDetails principal,
                                                      @Valid @RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(principal.getId(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingDto> getBooking(@AuthenticationPrincipal CustomUserDetails principal,
                                                   @PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id, principal.getId()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingDto>> getMyBookings(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(bookingService.getMyBookings(principal.getId()));
    }

    @GetMapping("/technician/my")
    public ResponseEntity<List<BookingDto>> getMyTechnicianBookings(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(bookingService.getMyTechnicianBookings(principal.getId()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BookingDto> updateStatus(@AuthenticationPrincipal CustomUserDetails principal,
                                                     @PathVariable Long id,
                                                     @Valid @RequestBody BookingStatusUpdateRequest request) {
        return ResponseEntity.ok(bookingService.updateStatus(id, principal.getId(), request));
    }
}
