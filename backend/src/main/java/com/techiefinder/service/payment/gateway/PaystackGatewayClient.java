package com.techiefinder.service.payment.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techiefinder.model.payment.Payment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

/**
 * Real integration against Paystack's Transactions API:
 * https://paystack.com/docs/payments/accept-payments/
 */
@Component
public class PaystackGatewayClient implements PaymentGatewayClient {

    private static final String BASE_URL = "https://api.paystack.co";
    private static final String PLACEHOLDER_MARKER = "your_paystack_secret_key";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${paystack.secret.key}")
    private String secretKey;

    public PaystackGatewayClient(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean isConfigured() {
        return secretKey != null && !secretKey.isBlank() && !secretKey.contains(PLACEHOLDER_MARKER);
    }

    @Override
    public Payment.PaymentGateway getGatewayType() {
        return Payment.PaymentGateway.PAYSTACK;
    }

    @Override
    public GatewayInitResult initialize(String email, BigDecimal amountNaira, String reference, String callbackUrl) {
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        // Paystack amounts are in kobo (the naira's smallest unit): 1 naira = 100 kobo.
        body.put("amount", amountNaira.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact());
        body.put("reference", reference);
        body.put("callback_url", callbackUrl);

        JsonNode data = post("/transaction/initialize", body).path("data");
        return new GatewayInitResult(data.path("authorization_url").asText(null), data.path("reference").asText(reference));
    }

    @Override
    public GatewayVerifyResult verify(String reference) {
        JsonNode data = get("/transaction/verify/" + reference).path("data");
        String status = data.path("status").asText("");
        BigDecimal amount = BigDecimal.valueOf(data.path("amount").asLong(0)).divide(BigDecimal.valueOf(100));
        return new GatewayVerifyResult("success".equalsIgnoreCase(status), reference, amount, status);
    }

    @Override
    public boolean verifyWebhookSignature(String rawBody, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] hash = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return MessageDigest.isEqual(hex.toString().getBytes(StandardCharsets.UTF_8), signatureHeader.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return false;
        }
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(secretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private JsonNode post(String path, Map<String, Object> body) {
        String response = restTemplate.exchange(BASE_URL + path, HttpMethod.POST,
                new HttpEntity<>(body, authHeaders()), String.class).getBody();
        return parse(response);
    }

    private JsonNode get(String path) {
        String response = restTemplate.exchange(BASE_URL + path, HttpMethod.GET,
                new HttpEntity<>(authHeaders()), String.class).getBody();
        return parse(response);
    }

    private JsonNode parse(String response) {
        try {
            return objectMapper.readTree(response);
        } catch (Exception e) {
            throw new IllegalStateException("Unreadable response from Paystack", e);
        }
    }
}
