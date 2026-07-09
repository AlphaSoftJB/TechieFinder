package com.techiefinder.controller.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${admin.default.email}")
    private String adminEmail;

    @Value("${admin.default.password}")
    private String adminPassword;

    private String uniqueEmail() {
        return "admin-test-" + UUID.randomUUID() + "@example.com";
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("accessToken").asText();
    }

    private String registerAndGetToken(String email, String role) throws Exception {
        Map<String, Object> body = Map.of(
                "email", email, "password", "password123", "firstName", "Test", "lastName", "User", "role", role);
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("accessToken").asText();
    }

    @Test
    void seededDefaultAdminCanLogIn() throws Exception {
        String token = loginAndGetToken(adminEmail, adminPassword);
        org.junit.jupiter.api.Assertions.assertFalse(token.isBlank());
    }

    @Test
    void registeringWithAdminRoleIsForbidden() throws Exception {
        Map<String, Object> body = Map.of(
                "email", uniqueEmail(), "password", "password123",
                "firstName", "Sneaky", "lastName", "User", "role", "ADMIN");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    @Test
    void nonAdminIsRejectedFromAdminEndpoints() throws Exception {
        String userToken = registerAndGetToken(uniqueEmail(), "USER");

        mockMvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanViewStatsUsersTechniciansBookingsAndRatings() throws Exception {
        String adminToken = loginAndGetToken(adminEmail, adminPassword);
        registerAndGetToken(uniqueEmail(), "USER");

        mockMvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").isNumber());

        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/admin/technicians").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/admin/bookings").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/admin/ratings").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void adminCanSuspendAndReactivateAUser() throws Exception {
        String adminToken = loginAndGetToken(adminEmail, adminPassword);
        String targetEmail = uniqueEmail();
        registerAndGetToken(targetEmail, "USER");

        MvcResult usersResult = mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode users = objectMapper.readTree(usersResult.getResponse().getContentAsString());
        long targetId = -1;
        for (JsonNode u : users) {
            if (targetEmail.equals(u.get("email").asText())) {
                targetId = u.get("id").asLong();
            }
        }
        org.junit.jupiter.api.Assertions.assertTrue(targetId > 0);

        mockMvc.perform(patch("/api/admin/users/" + targetId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("active", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        // A suspended account must be rejected at login.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", targetEmail, "password", "password123"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/admin/users/" + targetId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("active", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", targetEmail, "password", "password123"))))
                .andExpect(status().isOk());
    }

    @Test
    void adminCannotSuspendAnotherAdmin() throws Exception {
        String adminToken = loginAndGetToken(adminEmail, adminPassword);

        MvcResult usersResult = mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode users = objectMapper.readTree(usersResult.getResponse().getContentAsString());
        long adminId = -1;
        for (JsonNode u : users) {
            if (adminEmail.equals(u.get("email").asText())) {
                adminId = u.get("id").asLong();
            }
        }
        org.junit.jupiter.api.Assertions.assertTrue(adminId > 0);

        mockMvc.perform(patch("/api/admin/users/" + adminId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("active", false))))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanUpdateTechnicianVerificationStatus() throws Exception {
        String adminToken = loginAndGetToken(adminEmail, adminPassword);
        String techToken = registerAndGetToken(uniqueEmail(), "TECHNICIAN");

        // Create the technician profile for the freshly-registered technician user.
        JsonNode decoded = decodeUserId(techToken);
        long userId = decoded.asLong();

        MvcResult createResult = mockMvc.perform(post("/api/technicians/create/" + userId)
                        .header("Authorization", "Bearer " + techToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode technician = objectMapper.readTree(createResult.getResponse().getContentAsString());
        long technicianId = technician.get("id").asLong();
        org.junit.jupiter.api.Assertions.assertEquals("PENDING", technician.get("verificationStatus").asText());

        mockMvc.perform(patch("/api/admin/technicians/" + technicianId + "/verification")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "VERIFIED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus").value("VERIFIED"))
                .andExpect(jsonPath("$.verified").value(true));
    }

    private JsonNode decodeUserId(String token) throws Exception {
        String[] parts = token.split("\\.");
        String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
        JsonNode payload = objectMapper.readTree(payloadJson);
        // JwtTokenProvider signs the subject as the user's email, not id, so fetch by email instead.
        String email = payload.get("sub").asText();
        MvcResult result = mockMvc.perform(get("/api/users/email/" + email)
                        .header("Authorization", "Bearer " + loginAndGetToken(adminEmail, adminPassword)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode user = objectMapper.readTree(result.getResponse().getContentAsString());
        return user.get("id");
    }
}
