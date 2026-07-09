package com.techiefinder.controller.payment;

import com.techiefinder.dto.payment.PaymentDto;
import com.techiefinder.security.CustomUserDetails;
import com.techiefinder.service.payment.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/bookings/{bookingId}/pay")
    public ResponseEntity<PaymentDto> payForBooking(@AuthenticationPrincipal CustomUserDetails principal,
                                                      @PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.payForBooking(principal.getId(), bookingId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<PaymentDto>> getMyPayments(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(paymentService.getMyPayments(principal.getId()));
    }
}
