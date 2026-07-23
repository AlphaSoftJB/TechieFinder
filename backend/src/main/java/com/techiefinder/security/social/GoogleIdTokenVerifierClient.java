package com.techiefinder.security.social;

import com.techiefinder.model.user.User;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class GoogleIdTokenVerifierClient {

    private static final String JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> VALID_ISSUERS = Set.of("https://accounts.google.com", "accounts.google.com");

    private final String clientId;
    private final JwksIdTokenVerifier verifier;

    @Autowired
    public GoogleIdTokenVerifierClient(@Value("${google.oauth.client-id:}") String clientId) {
        this.clientId = clientId;
        this.verifier = isConfigured(clientId) ? new JwksIdTokenVerifier(JWKS_URL, VALID_ISSUERS) : null;
    }

    // Package-private: for tests, to inject a verifier backed by a fake JwkProvider.
    GoogleIdTokenVerifierClient(String clientId, JwksIdTokenVerifier verifier) {
        this.clientId = clientId;
        this.verifier = verifier;
    }

    private static boolean isConfigured(String clientId) {
        return clientId != null && !clientId.isBlank();
    }

    public boolean isConfigured() {
        return isConfigured(clientId);
    }

    public SocialIdentity verify(String idToken) {
        Claims claims = verifier.verify(idToken, Set.of(clientId));
        return new SocialIdentity(
                User.AuthProvider.GOOGLE,
                claims.getSubject(),
                claims.get("email", String.class),
                claims.get("given_name", String.class),
                claims.get("family_name", String.class),
                Boolean.parseBoolean(String.valueOf(claims.get("email_verified", Object.class)))
        );
    }
}
