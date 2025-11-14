#!/bin/bash

BASE_DIR="/home/ubuntu/TechieFinder/backend/src/main/java/com/techiefinder"

echo "Generating Controllers..."

# AuthController
mkdir -p "$BASE_DIR/controller/auth"

cat > "$BASE_DIR/controller/auth/AuthController.java" << 'EOF'
package com.techiefinder.controller.auth;

import com.techiefinder.dto.auth.AuthResponse;
import com.techiefinder.dto.auth.LoginRequest;
import com.techiefinder.dto.auth.RegisterRequest;
import com.techiefinder.service.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is running");
    }
}
EOF

# UserController
mkdir -p "$BASE_DIR/controller/user"

cat > "$BASE_DIR/controller/user/UserController.java" << 'EOF'
package com.techiefinder.controller.user;

import com.techiefinder.dto.user.UserDto;
import com.techiefinder.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }
}
EOF

# TechnicianController
mkdir -p "$BASE_DIR/controller/technician"

cat > "$BASE_DIR/controller/technician/TechnicianController.java" << 'EOF'
package com.techiefinder.controller.technician;

import com.techiefinder.dto.technician.TechnicianDto;
import com.techiefinder.service.technician.TechnicianService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technicians")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TechnicianController {

    @Autowired
    private TechnicianService technicianService;

    @PostMapping("/create/{userId}")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN')")
    public ResponseEntity<TechnicianDto> createTechnician(@PathVariable Long userId) {
        return ResponseEntity.ok(technicianService.createTechnician(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TechnicianDto> getTechnicianById(@PathVariable Long id) {
        return ResponseEntity.ok(technicianService.getTechnicianById(id));
    }

    @GetMapping("/available")
    public ResponseEntity<List<TechnicianDto>> getAllAvailableTechnicians() {
        return ResponseEntity.ok(technicianService.getAllAvailableTechnicians());
    }
}
EOF

# Public Controller for unauthenticated access
mkdir -p "$BASE_DIR/controller/public"

cat > "$BASE_DIR/controller/public/PublicController.java" << 'EOF'
package com.techiefinder.controller.public;

import com.techiefinder.dto.technician.ServiceCategoryDto;
import com.techiefinder.model.technician.ServiceCategory;
import com.techiefinder.repository.technician.ServiceCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PublicController {

    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("TechieFinder API is running");
    }

    @GetMapping("/categories")
    public ResponseEntity<List<ServiceCategoryDto>> getAllCategories() {
        List<ServiceCategoryDto> categories = serviceCategoryRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(categories);
    }

    private ServiceCategoryDto mapToDto(ServiceCategory category) {
        ServiceCategoryDto dto = new ServiceCategoryDto();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setSlug(category.getSlug());
        dto.setDescription(category.getDescription());
        dto.setIconUrl(category.getIconUrl());
        return dto;
    }
}
EOF

echo "Controllers generated successfully!"
