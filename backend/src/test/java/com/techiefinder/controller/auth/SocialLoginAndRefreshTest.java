package com.techiefinder.controller.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techiefinder.model.user.User;
import com.techiefinder.repository.user.UserRepository;
import com.techiefinder.security.social.AppleIdTokenVerifierClient;
import com.techiefinder.security.social.GoogleIdTokenVerifierClient;
import com.techiefinder.security.social.SocialIdentity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers /api/auth/social/{google,apple} and /api/auth/refresh. Real Google/
 * Apple ID token *signature* verification is covered separately by
 * JwksIdTokenVerifierTest -- here the verifier clients are mocked so these
 * tests focus on SocialAuthService's find-or-create/account-linking logic
 * and the plain HTTP contract.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:test-social-${random.uuid}"
})
class SocialLoginAndRefreshTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private GoogleIdTokenVerifierClient googleClient;

    @MockBean
    private AppleIdTokenVerifierClient appleClient;

    private String uniqueEmail() {
        return "social-" + UUID.randomUUID() + "@example.com";
    }

    @BeforeEach
    void setUp() {
        reset(googleClient, appleClient);
        when(googleClient.isConfigured()).thenReturn(true);
        when(appleClient.isConfigured()).thenReturn(true);
    }

    private JsonNode postSocialLogin(String provider, String email, String subject, String body) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/social/" + provider)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    @Test
    void googleSignInCreatesANewUserOnFirstLogin() throws Exception {
        String email = uniqueEmail();
        when(googleClient.verify("fake-google-token")).thenReturn(
                new SocialIdentity(User.AuthProvider.GOOGLE, "google-sub-" + UUID.randomUUID(), email, "Ada", "Lovelace", true));

        mockMvc.perform(post("/api/auth/social/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("idToken", "fake-google-token"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.firstName").value("Ada"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void googleSignInReusesTheSameUserOnASecondLogin() throws Exception {
        String email = uniqueEmail();
        String subject = "google-sub-" + UUID.randomUUID();
        when(googleClient.verify("fake-google-token")).thenReturn(
                new SocialIdentity(User.AuthProvider.GOOGLE, subject, email, "Grace", "Hopper", true));

        JsonNode first = postSocialLogin("google", email, subject,
                objectMapper.writeValueAsString(Map.of("idToken", "fake-google-token")));
        JsonNode second = postSocialLogin("google", email, subject,
                objectMapper.writeValueAsString(Map.of("idToken", "fake-google-token")));

        assertThat(first.get("userId").asLong()).isEqualTo(second.get("userId").asLong());
    }

    @Test
    void googleSignInLinksToAnExistingLocalAccountWithTheSameEmail() throws Exception {
        String email = uniqueEmail();
        Map<String, Object> registerBody = Map.of(
                "email", email, "password", "password123", "firstName", "Alan", "lastName", "Turing");
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerBody)))
                .andExpect(status().isOk())
                .andReturn();
        long localUserId = objectMapper.readTree(registerResult.getResponse().getContentAsString()).get("userId").asLong();

        when(googleClient.verify("fake-google-token")).thenReturn(
                new SocialIdentity(User.AuthProvider.GOOGLE, "google-sub-" + UUID.randomUUID(), email, "Alan", "Turing", true));

        JsonNode socialResponse = postSocialLogin("google", email, null,
                objectMapper.writeValueAsString(Map.of("idToken", "fake-google-token")));

        assertThat(socialResponse.get("userId").asLong()).isEqualTo(localUserId);
    }

    @Test
    void appleSignInUsesTheClientSuppliedNameSinceAppleNeverPutsOneInTheToken() throws Exception {
        String email = uniqueEmail();
        when(appleClient.verify("fake-apple-token")).thenReturn(
                new SocialIdentity(User.AuthProvider.APPLE, "apple-sub-" + UUID.randomUUID(), email, null, null, true));

        mockMvc.perform(post("/api/auth/social/apple")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "idToken", "fake-apple-token", "firstName", "Katherine", "lastName", "Johnson"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Katherine"))
                .andExpect(jsonPath("$.lastName").value("Johnson"));
    }

    @Test
    void googleSignInIsRejectedWithA400WhenNotConfigured() throws Exception {
        when(googleClient.isConfigured()).thenReturn(false);

        mockMvc.perform(post("/api/auth/social/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("idToken", "irrelevant"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Google sign-in is not configured on this server"));
    }

    @Test
    void passwordLoginOnASocialOnlyAccountFailsWithAHelpfulMessage() throws Exception {
        String email = uniqueEmail();
        when(googleClient.verify(any())).thenReturn(
                new SocialIdentity(User.AuthProvider.GOOGLE, "google-sub-" + UUID.randomUUID(), email, "Ada", "Lovelace", true));
        mockMvc.perform(post("/api/auth/social/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("idToken", "fake-google-token"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", "whatever123"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("This account signs in with GOOGLE. Use that button instead of a password."));
    }

    @Test
    void refreshReturnsANewTokenPairForAValidRefreshToken() throws Exception {
        String email = uniqueEmail();
        Map<String, Object> registerBody = Map.of(
                "email", email, "password", "password123", "firstName", "Ada", "lastName", "Lovelace");
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerBody)))
                .andExpect(status().isOk())
                .andReturn();
        String refreshToken = objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .get("refreshToken").asText();

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", refreshToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void refreshRejectsAnInvalidToken() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", "not-a-real-token"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshRejectsATokenForASuspendedAccount() throws Exception {
        String email = uniqueEmail();
        Map<String, Object> registerBody = Map.of(
                "email", email, "password", "password123", "firstName", "Rosalind", "lastName", "Franklin");
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerBody)))
                .andExpect(status().isOk())
                .andReturn();
        String refreshToken = objectMapper.readTree(registerResult.getResponse().getContentAsString())
                .get("refreshToken").asText();

        User user = userRepository.findByEmail(email).orElseThrow();
        user.setActive(false);
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refreshToken", refreshToken))))
                .andExpect(status().isUnauthorized());
    }
}
