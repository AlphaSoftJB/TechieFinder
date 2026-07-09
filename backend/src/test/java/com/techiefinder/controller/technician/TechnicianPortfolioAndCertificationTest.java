package com.techiefinder.controller.technician;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TechnicianPortfolioAndCertificationTest {

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

    private record TechnicianContext(String token, long userId, long technicianId) {}

    private TechnicianContext registerTechnician(String suffix) throws Exception {
        Map<String, Object> body = Map.of(
                "email", "portfolio-tech-" + suffix + "@example.com", "password", "password123",
                "firstName", "Amaka", "lastName", "Eze", "role", "TECHNICIAN");
        JsonNode auth = perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)), 200);
        String token = auth.get("accessToken").asText();
        long userId = auth.get("userId").asLong();

        JsonNode profile = perform(post("/api/technicians/create/" + userId)
                .header("Authorization", "Bearer " + token), 200);
        return new TechnicianContext(token, userId, profile.get("id").asLong());
    }

    @Test
    void technicianCanUploadAndDeleteAPortfolioItem() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        TechnicianContext tech = registerTechnician(suffix);

        MockMultipartFile image = new MockMultipartFile("image", "work.jpg", "image/jpeg", "fake-image-bytes".getBytes());

        MvcResult uploadResult = mockMvc.perform(MockMvcRequestBuilders.multipart("/api/technicians/me/portfolio")
                        .file(image)
                        .param("title", "Kitchen pipe repair")
                        .param("description", "Fixed a burst pipe")
                        .param("categorySlug", "plumbing")
                        .header("Authorization", "Bearer " + tech.token()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode item = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        assertThat(item.get("title").asText()).isEqualTo("Kitchen pipe repair");
        assertThat(item.get("categoryName").asText()).isEqualTo("Plumbing");
        assertThat(item.get("imageUrl").asText()).startsWith("/uploads/portfolio/");
        long itemId = item.get("id").asLong();

        JsonNode publicList = perform(get("/api/technicians/" + tech.technicianId() + "/portfolio"), 200);
        assertThat(publicList).hasSize(1);

        // Another technician can't delete someone else's portfolio item.
        TechnicianContext otherTech = registerTechnician(suffix + "-other");
        mockMvc.perform(delete("/api/technicians/me/portfolio/" + itemId)
                        .header("Authorization", "Bearer " + otherTech.token()))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/technicians/me/portfolio/" + itemId)
                        .header("Authorization", "Bearer " + tech.token()))
                .andExpect(status().isNoContent());

        JsonNode afterDelete = perform(get("/api/technicians/" + tech.technicianId() + "/portfolio"), 200);
        assertThat(afterDelete).isEmpty();
    }

    @Test
    void rejectsAnUnsupportedFileTypeForPortfolio() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        TechnicianContext tech = registerTechnician(suffix);

        MockMultipartFile badFile = new MockMultipartFile("image", "malware.exe", "application/octet-stream", "not-an-image".getBytes());

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/technicians/me/portfolio")
                        .file(badFile)
                        .param("title", "Should fail")
                        .header("Authorization", "Bearer " + tech.token()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void technicianCanUploadACertificationAndAdminCanVerifyIt() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        TechnicianContext tech = registerTechnician(suffix);

        MockMultipartFile certFile = new MockMultipartFile("certificateFile", "cert.pdf", "application/pdf", "fake-pdf-bytes".getBytes());

        MvcResult uploadResult = mockMvc.perform(MockMvcRequestBuilders.multipart("/api/technicians/me/certifications")
                        .file(certFile)
                        .param("name", "Certified Plumber")
                        .param("issuingOrganization", "Nigerian Institute of Plumbing")
                        .param("credentialId", "NIP-12345")
                        .header("Authorization", "Bearer " + tech.token()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode certification = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        assertThat(certification.get("verificationStatus").asText()).isEqualTo("PENDING");
        assertThat(certification.get("certificateUrl").asText()).startsWith("/uploads/certifications/");
        long certificationId = certification.get("id").asLong();

        JsonNode publicList = perform(get("/api/technicians/" + tech.technicianId() + "/certifications"), 200);
        assertThat(publicList).hasSize(1);

        String adminToken = perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("email", "admin@techiefinder.com", "password", "ChangeMe123!"))), 200)
                .get("accessToken").asText();

        JsonNode adminList = perform(get("/api/admin/certifications")
                .header("Authorization", "Bearer " + adminToken), 200);
        assertThat(adminList).anyMatch(c -> c.get("id").asLong() == certificationId);

        JsonNode verified = perform(patch("/api/admin/certifications/" + certificationId + "/verification")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "VERIFIED"))), 200);
        assertThat(verified.get("verificationStatus").asText()).isEqualTo("VERIFIED");

        // A non-admin can't verify certifications.
        mockMvc.perform(patch("/api/admin/certifications/" + certificationId + "/verification")
                        .header("Authorization", "Bearer " + tech.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("status", "VERIFIED"))))
                .andExpect(status().isForbidden());
    }
}
