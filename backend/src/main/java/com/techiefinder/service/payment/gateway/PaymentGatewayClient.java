package com.techiefinder.service.payment.gateway;

import com.techiefinder.model.payment.Payment;

import java.math.BigDecimal;

/**
 * A real, callable payment gateway integration. Implementations call out to
 * the actual Paystack/Flutterwave HTTP APIs -- there is no simulation inside
 * these classes. isConfigured() is what lets PaymentService fall back to the
 * wallet simulation when no real secret key has been supplied, instead of
 * every environment being forced to have live merchant credentials.
 */
public interface PaymentGatewayClient {

    boolean isConfigured();

    Payment.PaymentGateway getGatewayType();

    GatewayInitResult initialize(String email, BigDecimal amountNaira, String reference, String callbackUrl);

    GatewayVerifyResult verify(String reference);

    /**
     * Verifies that an inbound webhook call actually came from the gateway
     * (not a forged request), given the raw request body and whatever
     * signature header the gateway sends.
     */
    boolean verifyWebhookSignature(String rawBody, String signatureHeader);
}
