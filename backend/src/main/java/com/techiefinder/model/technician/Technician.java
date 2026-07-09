package com.techiefinder.model.technician;

import com.techiefinder.model.BaseEntity;
import com.techiefinder.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "technicians")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Technician extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, unique = true)
    private String technicianId; // e.g., TF-001234

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private Boolean available = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean acceptingJobs = true;

    @Column(precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalRatings = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer completedJobs = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer cancelledJobs = 0;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal walletBalance = BigDecimal.ZERO;

    private String businessName;
    private String businessRegistrationNumber;

    @Column(length = 2000)
    private String bio;

    private Integer yearsOfExperience;

    @OneToMany(mappedBy = "technician", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<TechnicianService> services = new HashSet<>();

    @OneToMany(mappedBy = "technician", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<TechnicianAvailability> availability = new HashSet<>();

    @OneToOne(mappedBy = "technician", cascade = CascadeType.ALL, orphanRemoval = true)
    private TechnicianLocation location;

    @OneToMany(mappedBy = "technician", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<TechnicianPortfolio> portfolio = new HashSet<>();

    @OneToMany(mappedBy = "technician", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<TechnicianCertification> certifications = new HashSet<>();

    public enum VerificationStatus {
        PENDING,
        VERIFIED,
        REJECTED,
        SUSPENDED
    }
}
