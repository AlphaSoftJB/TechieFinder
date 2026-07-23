package com.techiefinder.service.auth;

import com.techiefinder.dto.auth.AuthResponse;
import com.techiefinder.dto.auth.LoginRequest;
import com.techiefinder.dto.auth.RegisterRequest;
import com.techiefinder.exception.ValidationException;
import com.techiefinder.model.user.User;
import com.techiefinder.model.user.UserProfile;
import com.techiefinder.repository.user.UserRepository;
import com.techiefinder.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalStateException("Email already exists");
        }

        // ADMIN accounts are never created through public self-registration --
        // otherwise anyone could POST {"role":"ADMIN", ...} and grant themselves
        // full admin access. Admins are seeded (DataInitializer) or created by
        // an existing admin; this endpoint only accepts USER or TECHNICIAN.
        if (request.getRole() == User.UserRole.ADMIN) {
            throw new SecurityException("Cannot self-register as an administrator account");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .role(request.getRole())
                .emailVerified(false)
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
        userRepository.save(user);

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

    public AuthResponse login(LoginRequest request) {
        User existing = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (existing != null && existing.getPassword() == null) {
            // Account was created via Google/Apple sign-in and has no password
            // to check -- fail fast with a clear message instead of letting
            // BCrypt compare against a null hash.
            throw new ValidationException(
                    "This account signs in with " + existing.getAuthProvider().name()
                            + ". Use that button instead of a password.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String accessToken = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("User not found"));

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

    /**
     * Redeems a refresh token for a fresh access/refresh pair, without
     * requiring the password again. Used by the mobile app's biometric
     * quick-unlock: the refresh token is the only thing stored on-device.
     */
    public AuthResponse refresh(String refreshToken) {
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        String email = tokenProvider.getUsernameFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new DisabledException("This account has been suspended");
        }

        String accessToken = tokenProvider.generateTokenFromUsername(user.getEmail());
        String newRefreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newRefreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .build();
    }
}
