package com.techiefinder.service.messaging;

import com.techiefinder.dto.messaging.ConversationDto;
import com.techiefinder.dto.messaging.MessageDto;
import com.techiefinder.model.messaging.Conversation;
import com.techiefinder.model.messaging.Message;
import com.techiefinder.model.notification.Notification;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.user.User;
import com.techiefinder.repository.messaging.ConversationRepository;
import com.techiefinder.repository.messaging.MessageRepository;
import com.techiefinder.repository.technician.TechnicianRepository;
import com.techiefinder.repository.user.UserRepository;
import com.techiefinder.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessagingService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public ConversationDto getOrCreateConversation(Long userId, Long technicianId) {
        Conversation conversation = conversationRepository.findByUserIdAndTechnicianId(userId, technicianId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("User not found"));
                    Technician technician = technicianRepository.findById(technicianId)
                            .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
                    Conversation created = Conversation.builder()
                            .user(user)
                            .technician(technician)
                            .unreadCountUser(0)
                            .unreadCountTechnician(0)
                            .build();
                    return conversationRepository.save(created);
                });
        return mapToDto(conversation);
    }

    public List<ConversationDto> getMyConversations(Long userId) {
        List<Conversation> asCustomer = conversationRepository.findByUserIdOrderByLastMessageAtDesc(userId);
        List<ConversationDto> result = asCustomer.stream().map(this::mapToDto).collect(Collectors.toList());

        technicianRepository.findByUserId(userId).ifPresent(technician -> {
            List<Conversation> asTechnician = conversationRepository
                    .findByTechnicianIdOrderByLastMessageAtDesc(technician.getId());
            asTechnician.stream().map(this::mapToDto).forEach(result::add);
        });

        return result;
    }

    @Transactional
    public MessageDto sendMessage(Long conversationId, Long senderId, String content) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        boolean isCustomer = conversation.getUser().getId().equals(senderId);
        boolean isTechnician = conversation.getTechnician().getUser().getId().equals(senderId);
        if (!isCustomer && !isTechnician) {
            throw new SecurityException("This conversation does not belong to you");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));

        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(content)
                .type(Message.MessageType.TEXT)
                .read(false)
                .build();
        message = messageRepository.save(message);

        conversation.setLastMessageAt(LocalDateTime.now());
        User notifyTarget;
        if (isCustomer) {
            conversation.setUnreadCountTechnician(conversation.getUnreadCountTechnician() + 1);
            notifyTarget = conversation.getTechnician().getUser();
        } else {
            conversation.setUnreadCountUser(conversation.getUnreadCountUser() + 1);
            notifyTarget = conversation.getUser();
        }
        conversationRepository.save(conversation);

        notificationService.notify(notifyTarget, Notification.NotificationType.NEW_MESSAGE,
                "New message",
                sender.getFirstName() + " sent you a message",
                "/conversations/" + conversation.getId());

        return mapToDto(message);
    }

    public List<MessageDto> getMessages(Long conversationId, Long requestingUserId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        boolean isCustomer = conversation.getUser().getId().equals(requestingUserId);
        boolean isTechnician = conversation.getTechnician().getUser().getId().equals(requestingUserId);
        if (!isCustomer && !isTechnician) {
            throw new SecurityException("This conversation does not belong to you");
        }

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private ConversationDto mapToDto(Conversation conversation) {
        ConversationDto dto = new ConversationDto();
        dto.setId(conversation.getId());
        dto.setUserId(conversation.getUser().getId());
        dto.setTechnicianId(conversation.getTechnician().getId());
        dto.setBookingId(conversation.getBooking() != null ? conversation.getBooking().getId() : null);
        dto.setLastMessageAt(conversation.getLastMessageAt());
        return dto;
    }

    private MessageDto mapToDto(Message message) {
        MessageDto dto = new MessageDto();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversation().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setContent(message.getContent());
        dto.setRead(message.getRead());
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }
}
