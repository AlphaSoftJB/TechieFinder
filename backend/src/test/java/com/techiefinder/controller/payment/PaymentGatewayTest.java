package com.techiefinder.controller.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the real Paystack checkout/verify/webhook code paths with a fake
 * (non-placeholder) secret key, using MockRestServiceServer to stand in for
 * Paystack's actual HTTP API -- this environment's egress proxy blocks calls
 * to api.paystack.co, and a live merchant account isn't available anyway, so
 * this is how the gateway integration itself gets verified without a real key.
 */
@SpringBootTest
@AutoConfigureMockMvc
// A distinct spring.datasource.url keeps this test's Spring context (which differs
// from the default context due to the property overrides below) from colliding with
// other contexts over the same named/shared H2 in-memory database.
@TestPropertySource(properties = {
        "payment.gateway.provider=paystack",
        "paystack.secret.key=sk_test_fake0123456789abcdef",
        "spring.datasource.url=jdbc:h2:mem:test-paystack-${random.uuid}"
})
class PaymentGatewayTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestTemplate restTemplate;

    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        mockServer = MockRestServiceServer.createServer(restTemplate);
    }

    private JsonNode perform(org.springframework.test.web.servlet.RequestBuilder request, int expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(request).andReturn();
        assertThat(result.getResponse().getStatus()).isEqualTo(expectedStatus);
        String body = result.getResponse().getContentAsString();
        return body.isBlank() ? null : objectMapper.readTree(body);
    }

    private long setUpConfirmedBooking(String suffix) throws Exception {
        Map<String, Object> customerBody = Map.of(
                "email", "gw-customer-" + suffix + "@example.com", "password", "password123",
                "firstName", "Chidi", "lastName", "Okafor");
        customerToken = perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(customerBody)), 200).get("accessToken").asText();

        Map<String, Object> techBody = Map.of(
                "email", "gw-tech-" + suffix + "@example.com", "password", "password123",
                "firstName", "Amaka", "lastName", "Eze", "role", "TECHNICIAN");
        JsonNode techAuth = perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(techBody)), 200);
        technicianToken = techAuth.get("accessToken").asText();
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

        perform(patch("/api/bookings/" + bookingId + "/status")
                .header("Authorization", "Bearer " + technicianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "CONFIRMED"))), 200);

        return bookingId;
    }

    private String customerToken;
    private String technicianToken;

    @Test
    void checkoutInitializesARealPaystackTransactionAndReturnsAuthorizationUrl() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        long bookingId = setUpConfirmedBooking(suffix);

        mockServer.expect(requestTo("https://api.paystack.co/transaction/initialize"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("""
                        {"status":true,"message":"Authorization URL created","data":
                        {"authorization_url":"https://checkout.paystack.com/abc123","access_code":"abc123","reference":"whatever"}}
                        """, MediaType.APPLICATION_JSON));

        JsonNode payment = perform(post("/api/payments/bookings/" + bookingId + "/pay")
                .header("Authorization", "Bearer " + customerToken), 200);

        assertThat(payment.get("requiresRedirect").asBoolean()).isTrue();
        assertThat(payment.get("authorizationUrl").asText()).isEqualTo("https://checkout.paystack.com/abc123");
        assertThat(payment.get("gateway").asText()).isEqualTo("PAYSTACK");
        assertThat(payment.get("status").asText()).isEqualTo("PENDING");
        mockServer.verify();
    }

    @Test
    void verifyFinalizesTheBookingWhenPaystackConfirmsSuccess() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        long bookingId = setUpConfirmedBooking(suffix);

        mockServer.expect(requestTo("https://api.paystack.co/transaction/initialize"))
                .andRespond(withSuccess("""
                        {"status":true,"data":{"authorization_url":"https://checkout.paystack.com/xyz","reference":"whatever"}}
                        """, MediaType.APPLICATION_JSON));
        JsonNode payment = perform(post("/api/payments/bookings/" + bookingId + "/pay")
                .header("Authorization", "Bearer " + customerToken), 200);
        String reference = payment.get("transactionReference").asText();
        mockServer.verify();

        // MockRestServiceServer requires all of an instance's expectations to be
        // registered before any request executes, so re-bind for this next phase.
        mockServer = MockRestServiceServer.createServer(restTemplate);
        mockServer.expect(requestTo("https://api.paystack.co/transaction/verify/" + reference))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {"status":true,"data":{"status":"success","reference":"%s","amount":1500000}}
                        """.formatted(reference), MediaType.APPLICATION_JSON));

        JsonNode verified = perform(get("/api/payments/verify/" + reference)
                .header("Authorization", "Bearer " + customerToken), 200);
        assertThat(verified.get("status").asText()).isEqualTo("SUCCESS");

        JsonNode booking = perform(get("/api/bookings/" + bookingId)
                .header("Authorization", "Bearer " + customerToken), 200);
        assertThat(booking.get("paymentStatus").asText()).isEqualTo("PAID");
        mockServer.verify();
    }

    @Test
    void verifyMarksThePaymentFailedWhenPaystackReportsFailure() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        long bookingId = setUpConfirmedBooking(suffix);

        mockServer.expect(requestTo("https://api.paystack.co/transaction/initialize"))
                .andRespond(withSuccess("""
                        {"status":true,"data":{"authorization_url":"https://checkout.paystack.com/xyz","reference":"whatever"}}
                        """, MediaType.APPLICATION_JSON));
        JsonNode payment = perform(post("/api/payments/bookings/" + bookingId + "/pay")
                .header("Authorization", "Bearer " + customerToken), 200);
        String reference = payment.get("transactionReference").asText();
        mockServer.verify();

        mockServer = MockRestServiceServer.createServer(restTemplate);
        mockServer.expect(requestTo("https://api.paystack.co/transaction/verify/" + reference))
                .andRespond(withSuccess("""
                        {"status":true,"data":{"status":"failed","reference":"%s","amount":1500000}}
                        """.formatted(reference), MediaType.APPLICATION_JSON));

        JsonNode verified = perform(get("/api/payments/verify/" + reference)
                .header("Authorization", "Bearer " + customerToken), 200);
        assertThat(verified.get("status").asText()).isEqualTo("FAILED");
    }

    @Test
    void webhookWithAnInvalidSignatureIsRejected() throws Exception {
        mockMvc.perform(post("/api/payments/webhook/paystack")
                        .header("x-paystack-signature", "not-a-real-signature")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"event\":\"charge.success\",\"data\":{\"reference\":\"whatever\"}}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void webhookWithAValidSignatureFinalizesThePayment() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        long bookingId = setUpConfirmedBooking(suffix);

        mockServer.expect(requestTo("https://api.paystack.co/transaction/initialize"))
                .andRespond(withSuccess("""
                        {"status":true,"data":{"authorization_url":"https://checkout.paystack.com/xyz","reference":"whatever"}}
                        """, MediaType.APPLICATION_JSON));
        JsonNode payment = perform(post("/api/payments/bookings/" + bookingId + "/pay")
                .header("Authorization", "Bearer " + customerToken), 200);
        String reference = payment.get("transactionReference").asText();
        mockServer.verify();

        String webhookBody = "{\"event\":\"charge.success\",\"data\":{\"reference\":\"" + reference + "\",\"status\":\"success\"}}";
        String signature = hmacSha512Hex(webhookBody, "sk_test_fake0123456789abcdef");

        mockServer = MockRestServiceServer.createServer(restTemplate);
        mockServer.expect(requestTo("https://api.paystack.co/transaction/verify/" + reference))
                .andRespond(withSuccess("""
                        {"status":true,"data":{"status":"success","reference":"%s","amount":1500000}}
                        """.formatted(reference), MediaType.APPLICATION_JSON));

        mockMvc.perform(post("/api/payments/webhook/paystack")
                        .header("x-paystack-signature", signature)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(webhookBody))
                .andExpect(status().isOk());

        JsonNode booking = perform(get("/api/bookings/" + bookingId)
                .header("Authorization", "Bearer " + customerToken), 200);
        assertThat(booking.get("paymentStatus").asText()).isEqualTo("PAID");
    }

    private String hmacSha512Hex(String body, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        byte[] hash = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }
}
