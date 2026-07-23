package com.techiefinder.security.social;

import com.techiefinder.model.user.User;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class AppleIdTokenVerifierClient {

    private static final String JWKS_URL = "https://appleid.apple.com/auth/keys";
    private static final Set<String> VALID_ISSUERS = Set.of("https://appleid.apple.com");

    // Apple's ID token audience is the web Service ID for "Sign in with Apple
    // JS" and the app's bundle identifier for native (expo-apple-authentication)
    // sign-in -- both are accepted since either flow can hit this same endpoint.
    private final Set<String> validAudiences;
    private final JwksIdTokenVerifier verifier;

    @Autowired
    public AppleIdTokenVerifierClient(
            @Value("${apple.oauth.client-id:}") String serviceId,
            @Value("${apple.oauth.bundle-id:}") String bundleId) {
        this.validAudiences = buildAudiences(serviceId, bundleId);
        this.verifier = isConfigured(this.validAudiences) ? new JwksIdTokenVerifier(JWKS_URL, VALID_ISSUERS) : null;
    }

    // Package-private: for tests, to inject a verifier backed by a fake JwkProvider.
    AppleIdTokenVerifierClient(Set<String> validAudiences, JwksIdTokenVerifier verifier) {
        this.validAudiences = validAudiences;
        this.verifier = verifier;
    }

    private static Set<String> buildAudiences(String serviceId, String bundleId) {
        Set<String> audiences = new HashSet<>();
        if (serviceId != null && !serviceId.isBlank()) audiences.add(serviceId);
        if (bundleId != null && !bundleId.isBlank()) audiences.add(bundleId);
        return audiences;
    }

    private static boolean isConfigured(Set<String> validAudiences) {
        return validAudiences != null && !validAudiences.isEmpty();
    }

    public boolean isConfigured() {
        return isConfigured(validAudiences);
    }

    public SocialIdentity verify(String idToken) {
        Claims claims = verifier.verify(idToken, validAudiences);
        // Apple never includes given_name/family_name in the ID token -- a name
        // is only ever handed to the client once, in the native authorization
        // response, so callers must pass it through SocialLoginRequest instead.
        return new SocialIdentity(
                User.AuthProvider.APPLE,
                claims.getSubject(),
                claims.get("email", String.class),
                null,
                null,
                Boolean.parseBoolean(String.valueOf(claims.get("email_verified", Object.class)))
        );
    }
}
