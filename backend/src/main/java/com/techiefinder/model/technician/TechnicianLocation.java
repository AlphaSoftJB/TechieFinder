package com.techiefinder.model.technician;

import com.techiefinder.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "technician_locations")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianLocation extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "technician_id", nullable = false, unique = true)
    private Technician technician;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String state;

    @Column(nullable = false)
    private String country = "Nigeria";

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Integer serviceRadiusKm = 10; // Default service radius in kilometers

    private String landmark;
}
