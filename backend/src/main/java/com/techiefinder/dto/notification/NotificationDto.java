package com.techiefinder.dto.notification;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDto {
    private Long id;
    private String type;
    private String title;
    private String message;
    private String actionUrl;
    private Boolean read;
    private LocalDateTime createdAt;
}
