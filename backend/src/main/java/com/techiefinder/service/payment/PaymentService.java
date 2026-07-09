package com.techiefinder.service.payment;

import com.techiefinder.dto.payment.PaymentDto;
import com.techiefinder.model.booking.Booking;
import com.techiefinder.model.notification.Notification;
import com.techiefinder.model.payment.Payment;
import com.techiefinder.repository.booking.BookingRepository;
import com.techiefinder.repository.payment.PaymentRepository;
import com.techiefinder.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Settles booking payments against the platform wallet. Paystack/Flutterwave
 * gateway integration requires live merchant API keys that aren't available
 * in this environment, so this service simulates an instant successful
 * payment instead of calling out to a real gateway. Swap payForBooking's
 * body for a real gateway call once PAYSTACK_SECRET_KEY / FLUTTERWAVE_SECRET_KEY
 * are configured.
 */
@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private NotificationService notificationService;

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

        Payment payment = Payment.builder()
                .transactionReference("TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase())
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

        return mapToDto(payment);
    }

    public List<PaymentDto> getMyPayments(Long userId) {
        return paymentRepository.findByUserId(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
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
