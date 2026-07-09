package com.techiefinder.controller.technician;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest
@AutoConfigureMockMvc
class TechnicianRecommendationTest {

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

    private long registerTechnicianWithRating(String suffix, String categorySlug, double rating, int completedJobs) throws Exception {
        Map<String, Object> body = Map.of(
                "email", "reco-tech-" + suffix + "@example.com", "password", "password123",
                "firstName", "Tech", "lastName", suffix, "role", "TECHNICIAN");
        JsonNode auth = perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)), 200);
        String token = auth.get("accessToken").asText();
        long userId = auth.get("userId").asLong();

        JsonNode profile = perform(post("/api/technicians/create/" + userId)
                .header("Authorization", "Bearer " + token), 200);
        long technicianId = profile.get("id").asLong();

        Map<String, Object> offering = Map.of(
                "categorySlug", categorySlug, "serviceName", "Test service",
                "basePrice", 5000, "pricingType", "FIXED");
        perform(post("/api/technicians/me/services")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(offering)), 200);

        Map<String, Object> location = Map.of(
                "address", "1 Test St", "city", "Lagos", "state", "Lagos",
                "latitude", 6.5244, "longitude", 3.3792, "serviceRadiusKm", 20);
        perform(put("/api/technicians/me/location")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(location)), 200);

        // Drive up rating/completed jobs via real bookings so the score reflects real data,
        // not directly-set fields (there's no admin/test-only setter for these).
        for (int i = 0; i < completedJobs; i++) {
            simulateCompletedRatedBooking(token, technicianId, rating);
        }

        return technicianId;
    }

    private void simulateCompletedRatedBooking(String technicianToken, long technicianId, double rating) throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Map<String, Object> customerBody = Map.of(
                "email", "reco-customer-" + suffix + "@example.com", "password", "password123",
                "firstName", "Cust", "lastName", suffix);
        String customerToken = perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(customerBody)), 200).get("accessToken").asText();

        Map<String, Object> bookingRequest = Map.of(
                "technicianId", technicianId,
                "scheduledDateTime", "2026-08-01T10:00:00",
                "serviceDescription", "Test job", "serviceAddress", "1 Test St",
                "city", "Lagos", "state", "Lagos", "estimatedPrice", 5000);
        JsonNode booking = perform(post("/api/bookings")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(bookingRequest)), 200);
        long bookingId = booking.get("id").asLong();

        perform(patch("/api/bookings/" + bookingId + "/status")
                .header("Authorization", "Bearer " + technicianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "CONFIRMED"))), 200);
        perform(patch("/api/bookings/" + bookingId + "/status")
                .header("Authorization", "Bearer " + technicianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "IN_PROGRESS"))), 200);
        perform(patch("/api/bookings/" + bookingId + "/status")
                .header("Authorization", "Bearer " + technicianToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "COMPLETED"))), 200);

        perform(post("/api/ratings")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("bookingId", bookingId, "rating", (int) rating))), 200);
    }

    @Test
    void recommendedEndpointIsReadableByGuestsAndRanksHigherRatedTechniciansFirst() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        long lowRated = registerTechnicianWithRating("low-" + suffix, "plumbing", 2, 1);
        long highRated = registerTechnicianWithRating("high-" + suffix, "plumbing", 5, 1);

        JsonNode recommended = perform(get("/api/technicians/recommended?limit=50"), 200);
        assertThat(recommended.isArray()).isTrue();

        int highIndex = -1;
        int lowIndex = -1;
        for (int i = 0; i < recommended.size(); i++) {
            long id = recommended.get(i).get("id").asLong();
            if (id == highRated) highIndex = i;
            if (id == lowRated) lowIndex = i;
        }
        assertThat(highIndex).isGreaterThanOrEqualTo(0);
        assertThat(lowIndex).isGreaterThanOrEqualTo(0);
        assertThat(highIndex).isLessThan(lowIndex);
        assertThat(recommended.get(highIndex).get("matchScore").asDouble())
                .isGreaterThan(recommended.get(lowIndex).get("matchScore").asDouble());
    }

    @Test
    void recommendedEndpointFactorsInProximityWhenCoordinatesAreSupplied() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        long technicianId = registerTechnicianWithRating("prox-" + suffix, "electrical", 4, 1);

        // The technician's location was set to lat 6.5244/lon 3.3792 (Lagos) --
        // querying from right there should score at least as well as from far away (Abuja).
        JsonNode nearby = perform(get("/api/technicians/recommended?latitude=6.5244&longitude=3.3792&limit=50"), 200);
        JsonNode farAway = perform(get("/api/technicians/recommended?latitude=9.0765&longitude=7.3986&limit=50"), 200);

        double nearScore = findScore(nearby, technicianId);
        double farScore = findScore(farAway, technicianId);
        assertThat(nearScore).isGreaterThanOrEqualTo(farScore);
    }

    private double findScore(JsonNode list, long technicianId) {
        for (JsonNode node : list) {
            if (node.get("id").asLong() == technicianId) {
                return node.get("matchScore").asDouble();
            }
        }
        throw new AssertionError("Technician " + technicianId + " not found in recommendation list");
    }
}
