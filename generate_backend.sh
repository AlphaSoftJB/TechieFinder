#!/bin/bash

# Script to generate all remaining backend files for TechieFinder

BASE_DIR="/home/ubuntu/TechieFinder/backend/src/main/java/com/techiefinder"

echo "Generating Technician Repositories..."

# TechnicianRepository
cat > "$BASE_DIR/repository/technician/TechnicianRepository.java" << 'EOF'
package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.Technician;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianRepository extends JpaRepository<Technician, Long> {
    Optional<Technician> findByUserId(Long userId);
    Optional<Technician> findByTechnicianId(String technicianId);
    List<Technician> findByVerificationStatus(Technician.VerificationStatus status);
    List<Technician> findByAvailableTrue();
    
    @Query("SELECT t FROM Technician t WHERE t.available = true AND t.acceptingJobs = true")
    List<Technician> findAvailableTechnicians();
}
EOF

# ServiceCategoryRepository
cat > "$BASE_DIR/repository/technician/ServiceCategoryRepository.java" << 'EOF'
package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.ServiceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ServiceCategoryRepository extends JpaRepository<ServiceCategory, Long> {
    Optional<ServiceCategory> findBySlug(String slug);
    Optional<ServiceCategory> findByName(String name);
}
EOF

# TechnicianServiceRepository
cat > "$BASE_DIR/repository/technician/TechnicianServiceRepository.java" << 'EOF'
package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.TechnicianService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianServiceRepository extends JpaRepository<TechnicianService, Long> {
    List<TechnicianService> findByTechnicianId(Long technicianId);
    List<TechnicianService> findByCategoryId(Long categoryId);
}
EOF

# TechnicianLocationRepository
cat > "$BASE_DIR/repository/technician/TechnicianLocationRepository.java" << 'EOF'
package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.TechnicianLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnicianLocationRepository extends JpaRepository<TechnicianLocation, Long> {
    Optional<TechnicianLocation> findByTechnicianId(Long technicianId);
    
    @Query(value = "SELECT * FROM technician_locations WHERE " +
           "(6371 * acos(cos(radians(:latitude)) * cos(radians(latitude)) * " +
           "cos(radians(longitude) - radians(:longitude)) + sin(radians(:latitude)) * " +
           "sin(radians(latitude)))) <= :radiusKm", nativeQuery = true)
    List<TechnicianLocation> findWithinRadius(
        @Param("latitude") Double latitude,
        @Param("longitude") Double longitude,
        @Param("radiusKm") Double radiusKm
    );
}
EOF

# TechnicianAvailabilityRepository
cat > "$BASE_DIR/repository/technician/TechnicianAvailabilityRepository.java" << 'EOF'
package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.TechnicianAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface TechnicianAvailabilityRepository extends JpaRepository<TechnicianAvailability, Long> {
    List<TechnicianAvailability> findByTechnicianId(Long technicianId);
    List<TechnicianAvailability> findByTechnicianIdAndDayOfWeek(Long technicianId, DayOfWeek dayOfWeek);
}
EOF

# TechnicianPortfolioRepository
cat > "$BASE_DIR/repository/technician/TechnicianPortfolioRepository.java" << 'EOF'
package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.TechnicianPortfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianPortfolioRepository extends JpaRepository<TechnicianPortfolio, Long> {
    List<TechnicianPortfolio> findByTechnicianIdOrderByDisplayOrderAsc(Long technicianId);
}
EOF

# TechnicianCertificationRepository
cat > "$BASE_DIR/repository/technician/TechnicianCertificationRepository.java" << 'EOF'
package com.techiefinder.repository.technician;

import com.techiefinder.model.technician.TechnicianCertification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TechnicianCertificationRepository extends JpaRepository<TechnicianCertification, Long> {
    List<TechnicianCertification> findByTechnicianId(Long technicianId);
}
EOF

echo "Generating Booking Repositories..."

# BookingRepository
cat > "$BASE_DIR/repository/booking/BookingRepository.java" << 'EOF'
package com.techiefinder.repository.booking;

import com.techiefinder.model.booking.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingNumber(String bookingNumber);
    List<Booking> findByUserId(Long userId);
    List<Booking> findByTechnicianId(Long technicianId);
    List<Booking> findByUserIdAndStatus(Long userId, Booking.BookingStatus status);
    List<Booking> findByTechnicianIdAndStatus(Long technicianId, Booking.BookingStatus status);
}
EOF

# PaymentRepository
cat > "$BASE_DIR/repository/payment/PaymentRepository.java" << 'EOF'
package com.techiefinder.repository.payment;

import com.techiefinder.model.payment.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionReference(String transactionReference);
    Optional<Payment> findByGatewayReference(String gatewayReference);
    List<Payment> findByUserId(Long userId);
    List<Payment> findByBookingId(Long bookingId);
}
EOF

# RatingRepository
cat > "$BASE_DIR/repository/rating/RatingRepository.java" << 'EOF'
package com.techiefinder.repository.rating;

import com.techiefinder.model.rating.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByTechnicianId(Long technicianId);
    Optional<Rating> findByBookingId(Long bookingId);
    
    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.technician.id = :technicianId")
    Double getAverageRatingForTechnician(@Param("technicianId") Long technicianId);
}
EOF

# MessageRepository
cat > "$BASE_DIR/repository/messaging/MessageRepository.java" << 'EOF'
package com.techiefinder.repository.messaging;

import com.techiefinder.model.messaging.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
}
EOF

# ConversationRepository
cat > "$BASE_DIR/repository/messaging/ConversationRepository.java" << 'EOF'
package com.techiefinder.repository.messaging;

import com.techiefinder.model.messaging.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    @Query("SELECT c FROM Conversation c WHERE (c.user.id = :userId OR c.technician.id = :userId) ORDER BY c.lastMessageAt DESC")
    List<Conversation> findByUserId(@Param("userId") Long userId);
    
    Optional<Conversation> findByUserIdAndTechnicianId(Long userId, Long technicianId);
}
EOF

# NotificationRepository
cat > "$BASE_DIR/repository/notification/NotificationRepository.java" << 'EOF'
package com.techiefinder.repository.notification;

import com.techiefinder.model.notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(Long userId);
    Long countByUserIdAndReadFalse(Long userId);
}
EOF

echo "All repositories created successfully!"
