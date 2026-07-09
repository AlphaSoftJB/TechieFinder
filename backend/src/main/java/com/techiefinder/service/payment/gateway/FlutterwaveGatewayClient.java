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
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

/**
 * Real integration against Flutterwave's v3 Standard Payments API:
 * https://developer.flutterwave.com/docs/collecting-payments/standard
 */
@Component
public class FlutterwaveGatewayClient implements PaymentGatewayClient {

    private static final String BASE_URL = "https://api.flutterwave.com/v3";
    private static final String PLACEHOLDER_MARKER = "your_flutterwave_secret_key";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${flutterwave.secret.key}")
    private String secretKey;

    @Value("${flutterwave.webhook.secret.hash:}")
    private String webhookSecretHash;

    public FlutterwaveGatewayClient(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean isConfigured() {
        return secretKey != null && !secretKey.isBlank() && !secretKey.toLowerCase().contains(PLACEHOLDER_MARKER);
    }

    @Override
    public Payment.PaymentGateway getGatewayType() {
        return Payment.PaymentGateway.FLUTTERWAVE;
    }

    @Override
    public GatewayInitResult initialize(String email, BigDecimal amountNaira, String reference, String callbackUrl) {
        Map<String, Object> customer = new HashMap<>();
        customer.put("email", email);

        Map<String, Object> body = new HashMap<>();
        body.put("tx_ref", reference);
        body.put("amount", amountNaira.toPlainString());
        body.put("currency", "NGN");
        body.put("redirect_url", callbackUrl);
        body.put("customer", customer);

        JsonNode data = post("/payments", body).path("data");
        return new GatewayInitResult(data.path("link").asText(null), reference);
    }

    @Override
    public GatewayVerifyResult verify(String reference) {
        String url = UriComponentsBuilder.fromHttpUrl(BASE_URL + "/transactions/verify_by_reference")
                .queryParam("tx_ref", reference)
                .toUriString();
        JsonNode data = get(url).path("data");
        String status = data.path("status").asText("");
        BigDecimal amount = data.path("amount").decimalValue();
        return new GatewayVerifyResult("successful".equalsIgnoreCase(status), reference, amount, status);
    }

    @Override
    public boolean verifyWebhookSignature(String rawBody, String signatureHeader) {
        if (webhookSecretHash == null || webhookSecretHash.isBlank() || signatureHeader == null) {
            return false;
        }
        // Flutterwave's webhook auth is a static shared secret echoed back in the
        // "verif-hash" header, not an HMAC of the payload -- see their webhook docs.
        return MessageDigest.isEqual(webhookSecretHash.getBytes(StandardCharsets.UTF_8), signatureHeader.getBytes(StandardCharsets.UTF_8));
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

    private JsonNode get(String url) {
        String response = restTemplate.exchange(url, HttpMethod.GET,
                new HttpEntity<>(authHeaders()), String.class).getBody();
        return parse(response);
    }

    private JsonNode parse(String response) {
        try {
            return objectMapper.readTree(response);
        } catch (Exception e) {
            throw new IllegalStateException("Unreadable response from Flutterwave", e);
        }
    }
}
