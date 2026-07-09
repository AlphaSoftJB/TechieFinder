package com.techiefinder.controller.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/**
 * payment.gateway.provider names a real gateway here, but the matching secret
 * key is still the dev placeholder -- PaymentService must treat that as
 * "not actually configured" and keep settling instantly against the wallet
 * simulation, rather than trying (and failing) to call a real API with a fake key.
 */
@SpringBootTest
@AutoConfigureMockMvc
// A distinct spring.datasource.url keeps this test's Spring context (which differs
// from the default context due to the property override below) from colliding with
// other contexts over the same named/shared H2 in-memory database.
@TestPropertySource(properties = {
        "payment.gateway.provider=paystack",
        "spring.datasource.url=jdbc:h2:mem:test-paystack-fallback-${random.uuid}"
})
class PaymentGatewayFallbackTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private JsonNode perform(org.springframework.test.web.servlet.RequestBuilder request, int expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(request).andReturn();
        assertThat(result.getResponse().getStatus()).isEqualTo(expectedStatus);
        String body = result.getResponse().getContentAsString();
        return body.isBlank() ? null : objectMapper.readTree(body);
    }

    @Test
    void fallsBackToWalletSimulationWhenSecretKeyIsStillThePlaceholder() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        Map<String, Object> customerBody = Map.of(
                "email", "fallback-customer-" + suffix + "@example.com", "password", "password123",
                "firstName", "Chidi", "lastName", "Okafor");
        String customerToken = perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(customerBody)), 200).get("accessToken").asText();

        Map<String, Object> techBody = Map.of(
                "email", "fallback-tech-" + suffix + "@example.com", "password", "password123",
                "firstName", "Amaka", "lastName", "Eze", "role", "TECHNICIAN");
        JsonNode techAuth = perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(techBody)), 200);
        String technicianToken = techAuth.get("accessToken").asText();
        long technicianUserId = techAuth.get("userId").asLong();

        JsonNode technicianProfile = perform(post("/api/technicians/create/" + technicianUserId)
                .header("Authorization", "Bearer " + technicianToken), 200);
        long technicianId = technicianProfile.get("id").asLong();

        Map<String, Object> bookingRequest = Map.of(
                "technicianId", technicianId,
                "scheduledDateTime", "2026-08-01T10:00:00",
                "serviceDescription", "Fix leaking kitchen pipe",
                "serviceAddress", "12 Allen Ave", "city", "Lagos", "state", "Lagos",
                "estimatedPrice", 15000);
        JsonNode booking = perform(post("/api/bookings")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bookingRequest)), 200);
        long bookingId = booking.get("id").asLong();

        JsonNode payment = perform(post("/api/payments/bookings/" + bookingId + "/pay")
                .header("Authorization", "Bearer " + customerToken), 200);

        assertThat(payment.get("gateway").asText()).isEqualTo("WALLET");
        assertThat(payment.get("status").asText()).isEqualTo("SUCCESS");
        assertThat(payment.get("requiresRedirect").asBoolean()).isFalse();
    }
}
