package com.techiefinder.security.social;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkException;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwsHeader;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SigningKeyResolverAdapter;
import io.jsonwebtoken.security.SignatureException;

import java.net.MalformedURLException;
import java.net.URL;
import java.security.Key;
import java.util.Set;

/**
 * Verifies a provider-issued ID token (Google and Apple both issue standard
 * RS256 JWTs) against that provider's published JWKS. Used by both
 * GoogleIdTokenVerifierClient and AppleIdTokenVerifierClient instead of
 * pulling in either provider's full SDK just to check a signature.
 */
public class JwksIdTokenVerifier {

    private final JwkProvider jwkProvider;
    private final Set<String> validIssuers;

    public JwksIdTokenVerifier(String jwksUrl, Set<String> validIssuers) {
        this(buildProvider(jwksUrl), validIssuers);
    }

    // Package-private: lets tests substitute a JwkProvider backed by a
    // known test key pair instead of making a real network call.
    JwksIdTokenVerifier(JwkProvider jwkProvider, Set<String> validIssuers) {
        this.jwkProvider = jwkProvider;
        this.validIssuers = validIssuers;
    }

    private static JwkProvider buildProvider(String jwksUrl) {
        try {
            return new JwkProviderBuilder(new URL(jwksUrl)).build();
        } catch (MalformedURLException e) {
            throw new IllegalArgumentException("Invalid JWKS URL: " + jwksUrl, e);
        }
    }

    public Claims verify(String token, Set<String> validAudiences) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKeyResolver(new SigningKeyResolverAdapter() {
                    @Override
                    public Key resolveSigningKey(JwsHeader header, Claims claims) {
                        try {
                            Jwk jwk = jwkProvider.get(header.getKeyId());
                            return jwk.getPublicKey();
                        } catch (JwkException e) {
                            throw new SignatureException("Unable to resolve signing key for kid=" + header.getKeyId(), e);
                        }
                    }
                })
                .build()
                .parseClaimsJws(token)
                .getBody();

        if (!validIssuers.contains(claims.getIssuer())) {
            throw new JwtException("Unexpected token issuer: " + claims.getIssuer());
        }
        if (validAudiences != null && !validAudiences.isEmpty() && !validAudiences.contains(claims.getAudience())) {
            throw new JwtException("Unexpected token audience: " + claims.getAudience());
        }
        return claims;
    }
}
