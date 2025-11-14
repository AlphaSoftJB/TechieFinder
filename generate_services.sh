#!/bin/bash

BASE_DIR="/home/ubuntu/TechieFinder/backend/src/main/java/com/techiefinder"

echo "Generating DTOs..."

# Auth DTOs
mkdir -p "$BASE_DIR/dto/auth"

cat > "$BASE_DIR/dto/auth/LoginRequest.java" << 'EOF'
package com.techiefinder.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    private String password;
}
EOF

cat > "$BASE_DIR/dto/auth/RegisterRequest.java" << 'EOF'
package com.techiefinder.dto.auth;

import com.techiefinder.model.user.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 6)
    private String password;
    
    @NotBlank
    private String firstName;
    
    @NotBlank
    private String lastName;
    
    private String phoneNumber;
    
    private User.UserRole role = User.UserRole.USER;
}
EOF

cat > "$BASE_DIR/dto/auth/AuthResponse.java" << 'EOF'
package com.techiefinder.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long userId;
    private String email;
    private String role;
}
EOF

# User DTOs
mkdir -p "$BASE_DIR/dto/user"

cat > "$BASE_DIR/dto/user/UserDto.java" << 'EOF'
package com.techiefinder.dto.user;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String role;
    private Boolean emailVerified;
    private Boolean phoneVerified;
    private String profileImageUrl;
}
EOF

# Technician DTOs
mkdir -p "$BASE_DIR/dto/technician"

cat > "$BASE_DIR/dto/technician/TechnicianDto.java" << 'EOF'
package com.techiefinder.dto.technician;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TechnicianDto {
    private Long id;
    private String technicianId;
    private String verificationStatus;
    private Boolean available;
    private Boolean acceptingJobs;
    private BigDecimal rating;
    private Integer totalRatings;
    private Integer completedJobs;
    private String businessName;
    private String bio;
    private Integer yearsOfExperience;
}
EOF

cat > "$BASE_DIR/dto/technician/ServiceCategoryDto.java" << 'EOF'
package com.techiefinder.dto.technician;

import lombok.Data;

@Data
public class ServiceCategoryDto {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private String iconUrl;
}
EOF

# Booking DTOs
mkdir -p "$BASE_DIR/dto/booking"

cat > "$BASE_DIR/dto/booking/BookingRequest.java" << 'EOF'
package com.techiefinder.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BookingRequest {
    @NotNull
    private Long technicianId;
    
    @NotNull
    private LocalDateTime scheduledDateTime;
    
    @NotBlank
    private String serviceDescription;
    
    private String userNotes;
    
    @NotBlank
    private String serviceAddress;
    
    @NotBlank
    private String city;
    
    @NotBlank
    private String state;
    
    private Double latitude;
    private Double longitude;
    
    @NotNull
    private BigDecimal estimatedPrice;
}
EOF

cat > "$BASE_DIR/dto/booking/BookingDto.java" << 'EOF'
package com.techiefinder.dto.booking;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BookingDto {
    private Long id;
    private String bookingNumber;
    private Long userId;
    private Long technicianId;
    private String status;
    private LocalDateTime scheduledDateTime;
    private String serviceDescription;
    private String serviceAddress;
    private BigDecimal estimatedPrice;
    private BigDecimal finalPrice;
    private String paymentStatus;
}
EOF

echo "Generating Services..."

# AuthService
mkdir -p "$BASE_DIR/service/auth"

cat > "$BASE_DIR/service/auth/AuthService.java" << 'EOF'
package com.techiefinder.service.auth;

import com.techiefinder.dto.auth.AuthResponse;
import com.techiefinder.dto.auth.LoginRequest;
import com.techiefinder.dto.auth.RegisterRequest;
import com.techiefinder.model.user.User;
import com.techiefinder.model.user.UserProfile;
import com.techiefinder.repository.user.UserRepository;
import com.techiefinder.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
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
            throw new RuntimeException("Email already exists");
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

        // Create user profile
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
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String accessToken = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
EOF

# UserService
mkdir -p "$BASE_DIR/service/user"

cat > "$BASE_DIR/service/user/UserService.java" << 'EOF'
package com.techiefinder.service.user;

import com.techiefinder.dto.user.UserDto;
import com.techiefinder.model.user.User;
import com.techiefinder.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDto(user);
    }

    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDto(user);
    }

    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setRole(user.getRole().name());
        dto.setEmailVerified(user.getEmailVerified());
        dto.setPhoneVerified(user.getPhoneVerified());
        dto.setProfileImageUrl(user.getProfileImageUrl());
        return dto;
    }
}
EOF

# TechnicianService
mkdir -p "$BASE_DIR/service/technician"

cat > "$BASE_DIR/service/technician/TechnicianService.java" << 'EOF'
package com.techiefinder.service.technician;

import com.techiefinder.dto.technician.TechnicianDto;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.user.User;
import com.techiefinder.repository.technician.TechnicianRepository;
import com.techiefinder.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TechnicianService {

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public TechnicianDto createTechnician(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.UserRole.TECHNICIAN) {
            throw new RuntimeException("User is not a technician");
        }

        Technician technician = Technician.builder()
                .user(user)
                .technicianId("TF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .verificationStatus(Technician.VerificationStatus.PENDING)
                .available(true)
                .acceptingJobs(true)
                .rating(BigDecimal.ZERO)
                .totalRatings(0)
                .completedJobs(0)
                .cancelledJobs(0)
                .walletBalance(BigDecimal.ZERO)
                .build();

        technician = technicianRepository.save(technician);
        return mapToDto(technician);
    }

    public TechnicianDto getTechnicianById(Long id) {
        Technician technician = technicianRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Technician not found"));
        return mapToDto(technician);
    }

    public List<TechnicianDto> getAllAvailableTechnicians() {
        return technicianRepository.findAvailableTechnicians()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private TechnicianDto mapToDto(Technician technician) {
        TechnicianDto dto = new TechnicianDto();
        dto.setId(technician.getId());
        dto.setTechnicianId(technician.getTechnicianId());
        dto.setVerificationStatus(technician.getVerificationStatus().name());
        dto.setAvailable(technician.getAvailable());
        dto.setAcceptingJobs(technician.getAcceptingJobs());
        dto.setRating(technician.getRating());
        dto.setTotalRatings(technician.getTotalRatings());
        dto.setCompletedJobs(technician.getCompletedJobs());
        dto.setBusinessName(technician.getBusinessName());
        dto.setBio(technician.getBio());
        dto.setYearsOfExperience(technician.getYearsOfExperience());
        return dto;
    }
}
EOF

echo "Services generated successfully!"
