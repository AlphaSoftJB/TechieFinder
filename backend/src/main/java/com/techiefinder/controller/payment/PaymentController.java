package com.techiefinder.controller.payment;

import com.techiefinder.dto.payment.PaymentDto;
import com.techiefinder.model.payment.Payment;
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

    @GetMapping("/verify/{reference}")
    public ResponseEntity<PaymentDto> verify(@AuthenticationPrincipal CustomUserDetails principal,
                                               @PathVariable String reference) {
        return ResponseEntity.ok(paymentService.verifyGatewayPayment(principal.getId(), reference));
    }

    @PostMapping("/webhook/paystack")
    public ResponseEntity<Void> paystackWebhook(@RequestBody String rawBody,
                                                  @RequestHeader(value = "x-paystack-signature", required = false) String signature) {
        paymentService.handleWebhook(Payment.PaymentGateway.PAYSTACK, rawBody, signature);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/webhook/flutterwave")
    public ResponseEntity<Void> flutterwaveWebhook(@RequestBody String rawBody,
                                                     @RequestHeader(value = "verif-hash", required = false) String signature) {
        paymentService.handleWebhook(Payment.PaymentGateway.FLUTTERWAVE, rawBody, signature);
        return ResponseEntity.ok().build();
    }
}
