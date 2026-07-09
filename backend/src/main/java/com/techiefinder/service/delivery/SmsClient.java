package com.techiefinder.service.delivery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Sends SMS via Termii's HTTP API (sms.api.url/sms.api.key). Without a real
 * key (the dev placeholder in application.properties), isConfigured() is
 * false and callers should skip sending rather than fail with a 401.
 */
@Component
public class SmsClient {

    private static final Logger log = LoggerFactory.getLogger(SmsClient.class);
    private static final String PLACEHOLDER_MARKER = "your-sms-api-key";

    private final RestTemplate restTemplate;

    @Value("${sms.api.key}")
    private String apiKey;

    @Value("${sms.api.url}")
    private String apiUrl;

    public SmsClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equals(PLACEHOLDER_MARKER);
    }

    /** Best-effort: returns whether the SMS was actually sent. */
    public boolean send(String phoneNumber, String message) {
        if (!isConfigured() || phoneNumber == null || phoneNumber.isBlank()) {
            return false;
        }
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("to", phoneNumber);
            body.put("sms", message);
            body.put("type", "plain");
            body.put("channel", "generic");
            body.put("api_key", apiKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(apiUrl, new HttpEntity<>(body, headers), String.class);
            return true;
        } catch (RestClientException e) {
            log.warn("SMS delivery failed", e);
            return false;
        }
    }
}
