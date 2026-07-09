package com.techiefinder.controller.rating;

import com.techiefinder.dto.rating.RatingDto;
import com.techiefinder.dto.rating.RatingRequest;
import com.techiefinder.security.CustomUserDetails;
import com.techiefinder.service.rating.RatingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {

    @Autowired
    private RatingService ratingService;

    @PostMapping
    public ResponseEntity<RatingDto> rateBooking(@AuthenticationPrincipal CustomUserDetails principal,
                                                   @Valid @RequestBody RatingRequest request) {
        return ResponseEntity.ok(ratingService.rateBooking(principal.getId(), request));
    }

    @GetMapping("/technician/{technicianId}")
    public ResponseEntity<List<RatingDto>> getTechnicianRatings(@PathVariable Long technicianId) {
        return ResponseEntity.ok(ratingService.getTechnicianRatings(technicianId));
    }
}
