package com.techiefinder.model.user;

import com.techiefinder.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "user_profiles")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(length = 1000)
    private String bio;

    private String city;
    private String state;
    private String country;

    @Column(nullable = false)
    private String preferredLanguage = "en";

    @Column(nullable = false)
    private Boolean notificationsEnabled = true;

    @Column(nullable = false)
    private Boolean smsNotificationsEnabled = true;

    @Column(nullable = false)
    private Boolean emailNotificationsEnabled = true;

    public enum Gender {
        MALE,
        FEMALE,
        OTHER,
        PREFER_NOT_TO_SAY
    }
}
