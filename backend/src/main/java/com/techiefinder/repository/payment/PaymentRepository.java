package com.techiefinder.repository.payment;

import com.techiefinder.model.payment.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionReference(String transactionReference);
    Optional<Payment> findByGatewayReference(String gatewayReference);
    List<Payment> findByUserId(Long userId);
    List<Payment> findByBookingId(Long bookingId);
}
