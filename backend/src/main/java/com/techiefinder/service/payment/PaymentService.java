package com.techiefinder.service.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techiefinder.dto.payment.PaymentDto;
import com.techiefinder.model.booking.Booking;
import com.techiefinder.model.notification.Notification;
import com.techiefinder.model.payment.Payment;
import com.techiefinder.repository.booking.BookingRepository;
import com.techiefinder.repository.payment.PaymentRepository;
import com.techiefinder.service.notification.NotificationService;
import com.techiefinder.service.payment.gateway.FlutterwaveGatewayClient;
import com.techiefinder.service.payment.gateway.GatewayInitResult;
import com.techiefinder.service.payment.gateway.GatewayVerifyResult;
import com.techiefinder.service.payment.gateway.PaymentGatewayClient;
import com.techiefinder.service.payment.gateway.PaystackGatewayClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Settles booking payments. When a real Paystack/Flutterwave secret key is
 * configured (payment.gateway.provider + the matching *.secret.key), this
 * calls out to the real gateway and hands back a checkout URL for the client
 * to redirect to. Without one configured (the default), it falls back to an
 * instant simulated wallet settlement so the platform stays usable in dev/demo
 * environments with no merchant account.
 */
@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PaystackGatewayClient paystackClient;

    @Autowired
    private FlutterwaveGatewayClient flutterwaveClient;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${payment.gateway.provider:wallet}")
    private String configuredProvider;

    @Value("${payment.gateway.callback.url}")
    private String callbackUrl;

    @Transactional
    public PaymentDto payForBooking(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new SecurityException("This booking does not belong to you");
        }
        if (booking.getPaymentStatus() == Booking.PaymentStatus.PAID) {
            throw new IllegalStateException("This booking has already been paid for");
        }

        return activeGatewayClient()
                .map(client -> initializeGatewayCheckout(booking, client))
                .orElseGet(() -> settleWithWallet(booking));
    }

    @Transactional
    public PaymentDto verifyGatewayPayment(Long userId, String reference) {
        Payment payment = paymentRepository.findByTransactionReference(reference)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (!payment.getUser().getId().equals(userId)) {
            throw new SecurityException("This payment does not belong to you");
        }
        if (payment.getStatus() != Payment.PaymentStatus.SUCCESS) {
            finalizeFromGateway(payment);
        }
        return mapToDto(payment);
    }

    @Transactional
    public void handleWebhook(Payment.PaymentGateway gateway, String rawBody, String signatureHeader) {
        PaymentGatewayClient client = clientForGateway(gateway);
        if (!client.verifyWebhookSignature(rawBody, signatureHeader)) {
            throw new SecurityException("Invalid webhook signature");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(rawBody);
        } catch (Exception e) {
            throw new IllegalArgumentException("Malformed webhook payload");
        }

        String reference = gateway == Payment.PaymentGateway.PAYSTACK
                ? root.path("data").path("reference").asText(null)
                : root.path("data").path("tx_ref").asText(null);
        if (reference == null) {
            throw new IllegalArgumentException("Webhook payload missing a transaction reference");
        }

        Payment payment = paymentRepository.findByTransactionReference(reference)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for reference " + reference));
        if (payment.getStatus() != Payment.PaymentStatus.SUCCESS) {
            finalizeFromGateway(payment);
        }
    }

    public List<PaymentDto> getMyPayments(Long userId) {
        return paymentRepository.findByUserId(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private Optional<PaymentGatewayClient> activeGatewayClient() {
        PaymentGatewayClient client = switch (configuredProvider.toLowerCase()) {
            case "paystack" -> paystackClient;
            case "flutterwave" -> flutterwaveClient;
            default -> null;
        };
        return (client != null && client.isConfigured()) ? Optional.of(client) : Optional.empty();
    }

    private PaymentGatewayClient clientForGateway(Payment.PaymentGateway gateway) {
        return switch (gateway) {
            case PAYSTACK -> paystackClient;
            case FLUTTERWAVE -> flutterwaveClient;
            case WALLET -> throw new IllegalStateException("The wallet simulation has no gateway client");
        };
    }

    private PaymentDto initializeGatewayCheckout(Booking booking, PaymentGatewayClient client) {
        String reference = generateReference();
        GatewayInitResult result = client.initialize(booking.getUser().getEmail(), booking.getEstimatedPrice(), reference, callbackUrl);

        Payment payment = Payment.builder()
                .transactionReference(reference)
                .user(booking.getUser())
                .booking(booking)
                .amount(booking.getEstimatedPrice())
                .type(Payment.PaymentType.BOOKING_PAYMENT)
                .status(Payment.PaymentStatus.PENDING)
                .gateway(client.getGatewayType())
                .paymentMethod("card")
                .description("Payment for booking " + booking.getBookingNumber())
                .build();
        payment = paymentRepository.save(payment);

        PaymentDto dto = mapToDto(payment);
        dto.setAuthorizationUrl(result.getAuthorizationUrl());
        dto.setRequiresRedirect(true);
        return dto;
    }

    private PaymentDto settleWithWallet(Booking booking) {
        Payment payment = Payment.builder()
                .transactionReference(generateReference())
                .user(booking.getUser())
                .booking(booking)
                .amount(booking.getEstimatedPrice())
                .type(Payment.PaymentType.BOOKING_PAYMENT)
                .status(Payment.PaymentStatus.SUCCESS)
                .gateway(Payment.PaymentGateway.WALLET)
                .paidAt(LocalDateTime.now())
                .paymentMethod("wallet")
                .description("Payment for booking " + booking.getBookingNumber())
                .build();

        payment = paymentRepository.save(payment);

        booking.setPaymentStatus(Booking.PaymentStatus.PAID);
        bookingRepository.save(booking);

        notificationService.notify(booking.getTechnician().getUser(), Notification.NotificationType.PAYMENT_RECEIVED,
                "Payment received",
                "Payment received for booking #" + booking.getBookingNumber(),
                "/bookings/" + booking.getId());

        PaymentDto dto = mapToDto(payment);
        dto.setRequiresRedirect(false);
        return dto;
    }

    private void finalizeFromGateway(Payment payment) {
        PaymentGatewayClient client = clientForGateway(payment.getGateway());
        GatewayVerifyResult result = client.verify(payment.getTransactionReference());
        Booking booking = payment.getBooking();

        if (result.isSuccess()) {
            payment.setStatus(Payment.PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());
            payment.setGatewayResponse(result.getRawStatus());
            paymentRepository.save(payment);

            if (booking != null) {
                booking.setPaymentStatus(Booking.PaymentStatus.PAID);
                bookingRepository.save(booking);
                notificationService.notify(booking.getTechnician().getUser(), Notification.NotificationType.PAYMENT_RECEIVED,
                        "Payment received",
                        "Payment received for booking #" + booking.getBookingNumber(),
                        "/bookings/" + booking.getId());
            }
        } else {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setGatewayResponse(result.getRawStatus());
            paymentRepository.save(payment);

            if (booking != null) {
                notificationService.notify(booking.getUser(), Notification.NotificationType.PAYMENT_FAILED,
                        "Payment failed",
                        "Payment for booking #" + booking.getBookingNumber() + " could not be confirmed",
                        "/bookings/" + booking.getId());
            }
        }
    }

    private String generateReference() {
        return "TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private PaymentDto mapToDto(Payment payment) {
        PaymentDto dto = new PaymentDto();
        dto.setId(payment.getId());
        dto.setTransactionReference(payment.getTransactionReference());
        dto.setBookingId(payment.getBooking() != null ? payment.getBooking().getId() : null);
        dto.setAmount(payment.getAmount());
        dto.setType(payment.getType().name());
        dto.setStatus(payment.getStatus().name());
        dto.setGateway(payment.getGateway().name());
        dto.setPaidAt(payment.getPaidAt());
        return dto;
    }
}
