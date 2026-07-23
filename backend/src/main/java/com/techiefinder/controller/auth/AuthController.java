package com.techiefinder.controller.auth;

import com.techiefinder.dto.auth.AuthResponse;
import com.techiefinder.dto.auth.LoginRequest;
import com.techiefinder.dto.auth.RefreshTokenRequest;
import com.techiefinder.dto.auth.RegisterRequest;
import com.techiefinder.dto.auth.SocialLoginRequest;
import com.techiefinder.service.auth.AuthService;
import com.techiefinder.service.auth.SocialAuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private SocialAuthService socialAuthService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
    }

    @PostMapping("/social/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody SocialLoginRequest request) {
        return ResponseEntity.ok(socialAuthService.loginWithGoogle(request));
    }

    @PostMapping("/social/apple")
    public ResponseEntity<AuthResponse> loginWithApple(@Valid @RequestBody SocialLoginRequest request) {
        return ResponseEntity.ok(socialAuthService.loginWithApple(request));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is running");
    }
}
