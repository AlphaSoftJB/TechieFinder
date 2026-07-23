package com.techiefinder.model.user;

import com.techiefinder.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    // Nullable: accounts created via Google/Apple sign-in have no password --
    // they authenticate entirely through the provider's ID token.
    private String password;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true)
    private String phoneNumber;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Column(nullable = false)
    @Builder.Default
    private Boolean emailVerified = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean phoneVerified = false;

    private String profileImageUrl;

    private String fcmToken; // Firebase Cloud Messaging token for push notifications

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    // The provider's stable subject/user id (Google's "sub", Apple's "sub").
    // Null for LOCAL accounts.
    private String providerId;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserProfile profile;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<UserAddress> addresses = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<UserPaymentMethod> paymentMethods = new HashSet<>();

    public enum UserRole {
        USER,
        TECHNICIAN,
        ADMIN
    }

    public enum AuthProvider {
        LOCAL,
        GOOGLE,
        APPLE
    }
}
