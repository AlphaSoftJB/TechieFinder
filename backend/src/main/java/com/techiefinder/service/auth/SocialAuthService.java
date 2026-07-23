package com.techiefinder.service.auth;

import com.techiefinder.dto.auth.AuthResponse;
import com.techiefinder.dto.auth.SocialLoginRequest;
import com.techiefinder.exception.ValidationException;
import com.techiefinder.model.user.User;
import com.techiefinder.model.user.UserProfile;
import com.techiefinder.repository.user.UserRepository;
import com.techiefinder.security.JwtTokenProvider;
import com.techiefinder.security.social.AppleIdTokenVerifierClient;
import com.techiefinder.security.social.GoogleIdTokenVerifierClient;
import com.techiefinder.security.social.SocialIdentity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocialAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private GoogleIdTokenVerifierClient googleClient;

    @Autowired
    private AppleIdTokenVerifierClient appleClient;

    @Transactional
    public AuthResponse loginWithGoogle(SocialLoginRequest request) {
        if (!googleClient.isConfigured()) {
            throw new ValidationException("Google sign-in is not configured on this server");
        }
        return authenticateOrRegister(googleClient.verify(request.getIdToken()), request);
    }

    @Transactional
    public AuthResponse loginWithApple(SocialLoginRequest request) {
        if (!appleClient.isConfigured()) {
            throw new ValidationException("Apple sign-in is not configured on this server");
        }
        return authenticateOrRegister(appleClient.verify(request.getIdToken()), request);
    }

    private AuthResponse authenticateOrRegister(SocialIdentity identity, SocialLoginRequest request) {
        if (identity.getEmail() == null || identity.getEmail().isBlank()) {
            throw new ValidationException("Your " + identity.getProvider().name() + " account did not share an email address");
        }

        User user = userRepository.findByAuthProviderAndProviderId(identity.getProvider(), identity.getSubject())
                .orElseGet(() -> linkOrCreate(identity, request));

        String accessToken = tokenProvider.generateTokenFromUsername(user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .build();
    }

    private User linkOrCreate(SocialIdentity identity, SocialLoginRequest request) {
        return userRepository.findByEmail(identity.getEmail())
                .map(existing -> {
                    // Same email already registered another way (password, or the
                    // other social provider) -- link this identity to it rather
                    // than rejecting, so "sign in with Google" just works for an
                    // account someone originally created with a password.
                    existing.setAuthProvider(identity.getProvider());
                    existing.setProviderId(identity.getSubject());
                    return userRepository.save(existing);
                })
                .orElseGet(() -> createUser(identity, request));
    }

    private User createUser(SocialIdentity identity, SocialLoginRequest request) {
        User.UserRole role = request.getRole() != null ? request.getRole() : User.UserRole.USER;
        if (role == User.UserRole.ADMIN) {
            // Same rule as ordinary self-registration: ADMIN accounts are
            // seeded or created by an existing admin only.
            throw new SecurityException("Cannot self-register as an administrator account");
        }

        String firstName = firstNonBlank(request.getFirstName(), identity.getFirstName(), "TechieFinder");
        String lastName = firstNonBlank(request.getLastName(), identity.getLastName(), "User");

        User user = User.builder()
                .email(identity.getEmail())
                .password(null)
                .firstName(firstName)
                .lastName(lastName)
                .role(role)
                .authProvider(identity.getProvider())
                .providerId(identity.getSubject())
                .emailVerified(identity.isEmailVerified())
                .phoneVerified(false)
                .build();
        user = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .preferredLanguage("en")
                .notificationsEnabled(true)
                .smsNotificationsEnabled(true)
                .emailNotificationsEnabled(true)
                .build();
        user.setProfile(profile);
        return userRepository.save(user);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
