package com.techiefinder.security.social;

import com.auth0.jwk.Jwk;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Exercises the actual JWT-signature-plus-claims verification logic against a
 * real RSA key pair (standing in for Google's/Apple's real signing keys),
 * with a fake JwkProvider instead of a real network call to their JWKS
 * endpoints.
 */
class JwksIdTokenVerifierTest {

    private static final String KEY_ID = "test-key-1";
    private static final String ISSUER = "https://accounts.google.com";
    private static final String AUDIENCE = "test-client-id.apps.googleusercontent.com";

    private RSAPrivateKey privateKey;
    private JwksIdTokenVerifier verifier;

    @BeforeEach
    void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();
        privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();

        Jwk jwk = Jwk.fromValues(jwkValues(publicKey));
        verifier = new JwksIdTokenVerifier(keyId -> keyId.equals(KEY_ID) ? jwk : null, Set.of(ISSUER));
    }

    private static Map<String, Object> jwkValues(RSAPublicKey publicKey) {
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        Map<String, Object> values = new HashMap<>();
        values.put("kty", "RSA");
        values.put("alg", "RS256");
        values.put("use", "sig");
        values.put("kid", KEY_ID);
        values.put("n", encoder.encodeToString(toUnsignedBytes(publicKey.getModulus())));
        values.put("e", encoder.encodeToString(toUnsignedBytes(publicKey.getPublicExponent())));
        return values;
    }

    private static byte[] toUnsignedBytes(BigInteger value) {
        byte[] bytes = value.toByteArray();
        if (bytes[0] == 0) {
            byte[] trimmed = new byte[bytes.length - 1];
            System.arraycopy(bytes, 1, trimmed, 0, trimmed.length);
            return trimmed;
        }
        return bytes;
    }

    private String signToken(String issuer, String audience, String subject) {
        Date now = new Date();
        return Jwts.builder()
                .setHeaderParam("kid", KEY_ID)
                .setIssuer(issuer)
                .setAudience(audience)
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + 60_000))
                .claim("email", "user@example.com")
                .claim("email_verified", true)
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }

    @Test
    void verifiesASignatureCorrectlySignedByTheMatchingPrivateKey() {
        String token = signToken(ISSUER, AUDIENCE, "user-subject-123");

        Claims claims = verifier.verify(token, Set.of(AUDIENCE));

        assertEquals("user-subject-123", claims.getSubject());
        assertEquals("user@example.com", claims.get("email", String.class));
    }

    @Test
    void rejectsATokenWithAnUnexpectedIssuer() {
        String token = signToken("https://not-google.example.com", AUDIENCE, "user-subject-123");

        assertThrows(JwtException.class, () -> verifier.verify(token, Set.of(AUDIENCE)));
    }

    @Test
    void rejectsATokenWithAnUnexpectedAudience() {
        String token = signToken(ISSUER, "some-other-client-id", "user-subject-123");

        assertThrows(JwtException.class, () -> verifier.verify(token, Set.of(AUDIENCE)));
    }

    @Test
    void rejectsATokenSignedByADifferentKeyPair() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        RSAPrivateKey otherPrivateKey = (RSAPrivateKey) generator.generateKeyPair().getPrivate();

        Date now = new Date();
        String token = Jwts.builder()
                .setHeaderParam("kid", KEY_ID)
                .setIssuer(ISSUER)
                .setAudience(AUDIENCE)
                .setSubject("user-subject-123")
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + 60_000))
                .signWith(otherPrivateKey, SignatureAlgorithm.RS256)
                .compact();

        assertThrows(io.jsonwebtoken.security.SignatureException.class, () -> verifier.verify(token, Set.of(AUDIENCE)));
    }
}
