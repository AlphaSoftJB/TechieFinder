package com.techiefinder.model.technician;

import com.techiefinder.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "technician_portfolios")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicianPortfolio extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "technician_id", nullable = false)
    private Technician technician;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private String imageUrl;

    private String videoUrl;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private ServiceCategory category;

    @Column(nullable = false)
    private Integer displayOrder = 0;
}
