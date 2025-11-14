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
