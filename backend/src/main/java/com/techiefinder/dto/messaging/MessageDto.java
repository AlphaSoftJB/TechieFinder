package com.techiefinder.dto.messaging;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageDto {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String content;
    private Boolean read;
    private LocalDateTime createdAt;
}
