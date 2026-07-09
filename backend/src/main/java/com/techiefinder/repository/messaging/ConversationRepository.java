package com.techiefinder.repository.messaging;

import com.techiefinder.model.messaging.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserIdOrderByLastMessageAtDesc(Long userId);

    List<Conversation> findByTechnicianIdOrderByLastMessageAtDesc(Long technicianId);

    Optional<Conversation> findByUserIdAndTechnicianId(Long userId, Long technicianId);
}
