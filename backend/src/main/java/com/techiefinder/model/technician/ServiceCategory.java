package com.techiefinder.model.technician;

import com.techiefinder.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_categories")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceCategory extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name; // e.g., "Plumbing", "Electrical", "Carpentry"

    @Column(nullable = false, unique = true)
    private String slug; // e.g., "plumbing", "electrical"

    @Column(length = 1000)
    private String description;

    private String iconUrl;

    @Column(nullable = false)
    private Integer displayOrder = 0;
}
