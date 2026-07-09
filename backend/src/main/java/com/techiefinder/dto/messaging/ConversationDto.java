package com.techiefinder.dto.messaging;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConversationDto {
    private Long id;
    private Long userId;
    private Long technicianId;
    private Long bookingId;
    private LocalDateTime lastMessageAt;
}
