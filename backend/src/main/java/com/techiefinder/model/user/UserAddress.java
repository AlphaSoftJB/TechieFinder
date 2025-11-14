package com.techiefinder.model.user;

import com.techiefinder.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_addresses")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAddress extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String label; // e.g., "Home", "Work", "Office"

    @Column(nullable = false)
    private String addressLine1;

    private String addressLine2;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String state;

    private String postalCode;

    @Column(nullable = false)
    private String country = "Nigeria";

    private Double latitude;
    private Double longitude;

    @Column(nullable = false)
    private Boolean isDefault = false;
}
