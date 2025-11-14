package com.techiefinder.model.messaging;

import com.techiefinder.model.BaseEntity;
import com.techiefinder.model.booking.Booking;
import com.techiefinder.model.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "conversations")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    @ManyToOne
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Message> messages = new HashSet<>();

    private LocalDateTime lastMessageAt;

    @Column(nullable = false)
    private Integer unreadCountUser = 0;

    @Column(nullable = false)
    private Integer unreadCountTechnician = 0;
}
