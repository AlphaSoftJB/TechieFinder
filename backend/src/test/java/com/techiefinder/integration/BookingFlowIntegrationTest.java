package com.techiefinder.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end regression test for the core product flow: a customer books a
 * technician, the technician confirms and completes the job, the customer pays
 * and rates it, and both parties exchange a message. This automates the same
 * sequence that was manually verified with curl while building these features.
 */
@SpringBootTest
@AutoConfigureMockMvc
class BookingFlowIntegrationTest {

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

    private JsonNode register(String email, String firstName, String lastName, String role) throws Exception {
        Map<String, Object> body = Map.of(
                "email", email, "password", "password123",
                "firstName", firstName, "lastName", lastName, "role", role);
        return perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)), 200);
    }

    @Test
    void fullBookingLifecycleWorksEndToEnd() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        JsonNode customer = register("customer-" + suffix + "@example.com", "Chidi", "Okafor", "USER");
        String customerToken = customer.get("accessToken").asText();

        JsonNode technicianAuth = register("tech-" + suffix + "@example.com", "Amaka", "Eze", "TECHNICIAN");
        String technicianToken = technicianAuth.get("accessToken").asText();
        long technicianUserId = technicianAuth.get("userId").asLong();

        JsonNode technicianProfile = perform(post("/api/technicians/create/" + technicianUserId)
                .header("Authorization", "Bearer " + technicianToken), 200);
        long technicianId = technicianProfile.get("id").asLong();

        Map<String, Object> offering = Map.of(
                "categorySlug", "plumbing", "serviceName", "Pipe repair",
                "basePrice", 5000, "pricingType", "FIXED");
        perform(post("/api/technicians/me/services")
                .header("Authorization", "Bearer " + technicianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(offering)), 200);

        Map<String, Object> location = Map.of(
                "address", "5 Allen Ave", "city", "Ikeja", "state", "Lagos",
                "latitude", 6.6018, "longitude", 3.3515, "serviceRadiusKm", 20);
        perform(put("/api/technicians/me/location")
                .header("Authorization", "Bearer " + technicianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(location)), 200);

        JsonNode categorySearch = perform(get("/api/technicians/available?category=plumbing")
                .header("Authorization", "Bearer " + customerToken), 200);
        assertThat(idsOf(categorySearch)).contains(technicianId);

        JsonNode nearbySearch = perform(get("/api/technicians/nearby?latitude=6.61&longitude=3.35&radiusKm=15")
                .header("Authorization", "Bearer " + customerToken), 200);
        assertThat(idsOf(nearbySearch)).contains(technicianId);

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
        assertThat(booking.get("status").asText()).isEqualTo("PENDING");

        // A customer can't act on the booking as if they were the technician.
        perform(patch("/api/bookings/" + bookingId + "/status")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "CONFIRMED"))), 403);

        JsonNode confirmed = perform(patch("/api/bookings/" + bookingId + "/status")
                .header("Authorization", "Bearer " + technicianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "CONFIRMED"))), 200);
        assertThat(confirmed.get("status").asText()).isEqualTo("CONFIRMED");

        JsonNode payment = perform(post("/api/payments/bookings/" + bookingId + "/pay")
                .header("Authorization", "Bearer " + customerToken), 200);
        assertThat(payment.get("status").asText()).isEqualTo("SUCCESS");

        // Paying twice is rejected.
        perform(post("/api/payments/bookings/" + bookingId + "/pay")
                .header("Authorization", "Bearer " + customerToken), 409);

        perform(patch("/api/bookings/" + bookingId + "/status")
                .header("Authorization", "Bearer " + technicianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "IN_PROGRESS"))), 200);
        JsonNode completed = perform(patch("/api/bookings/" + bookingId + "/status")
                .header("Authorization", "Bearer " + technicianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "COMPLETED"))), 200);
        assertThat(completed.get("status").asText()).isEqualTo("COMPLETED");

        Map<String, Object> ratingRequest = Map.of("bookingId", bookingId, "rating", 5, "review", "Great work!");
        perform(post("/api/ratings")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ratingRequest)), 200);

        // Rating twice on the same booking is rejected.
        perform(post("/api/ratings")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ratingRequest)), 409);

        JsonNode technicianAfter = perform(get("/api/technicians/" + technicianId)
                .header("Authorization", "Bearer " + customerToken), 200);
        assertThat(technicianAfter.get("rating").asDouble()).isEqualTo(5.0);
        assertThat(technicianAfter.get("totalRatings").asInt()).isEqualTo(1);
        assertThat(technicianAfter.get("completedJobs").asInt()).isEqualTo(1);

        JsonNode conversation = perform(post("/api/conversations/with-technician/" + technicianId)
                .header("Authorization", "Bearer " + customerToken), 200);
        long conversationId = conversation.get("id").asLong();

        perform(post("/api/conversations/" + conversationId + "/messages")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("content", "Thanks again!"))), 200);

        JsonNode messages = perform(get("/api/conversations/" + conversationId + "/messages")
                .header("Authorization", "Bearer " + technicianToken), 200);
        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).get("content").asText()).isEqualTo("Thanks again!");

        JsonNode technicianNotifications = perform(get("/api/notifications/my")
                .header("Authorization", "Bearer " + technicianToken), 200);
        List<String> notificationTypes = StreamSupport.stream(technicianNotifications.spliterator(), false)
                .map(n -> n.get("type").asText())
                .toList();
        assertThat(notificationTypes).contains("BOOKING_CREATED", "PAYMENT_RECEIVED", "NEW_RATING", "NEW_MESSAGE");
    }

    private List<Long> idsOf(JsonNode array) {
        return StreamSupport.stream(array.spliterator(), false)
                .map(n -> n.get("id").asLong())
                .toList();
    }
}
