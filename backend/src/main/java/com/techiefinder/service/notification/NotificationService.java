package com.techiefinder.service.notification;

import com.techiefinder.dto.notification.NotificationDto;
import com.techiefinder.model.notification.Notification;
import com.techiefinder.model.user.User;
import com.techiefinder.model.user.UserProfile;
import com.techiefinder.repository.notification.NotificationRepository;
import com.techiefinder.service.delivery.EmailClient;
import com.techiefinder.service.delivery.PushNotificationClient;
import com.techiefinder.service.delivery.SmsClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PushNotificationClient pushNotificationClient;

    @Autowired
    private EmailClient emailClient;

    @Autowired
    private SmsClient smsClient;

    /**
     * Always records an in-app notification, then makes a best-effort attempt at
     * push/email/SMS delivery on top of it -- each channel is independently
     * optional (respects the user's notification preferences) and independently
     * safe to fail (a delivery-provider outage should never block the in-app
     * notification from being saved).
     */
    @Transactional
    public void notify(User user, Notification.NotificationType type, String title, String message, String actionUrl) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .actionUrl(actionUrl)
                .read(false)
                .build();

        UserProfile profile = user.getProfile();
        boolean wantsNotifications = profile == null || Boolean.TRUE.equals(profile.getNotificationsEnabled());

        if (wantsNotifications && pushNotificationClient.send(user.getFcmToken(), title, message)) {
            notification.setSentViaPush(true);
        }
        if (wantsNotifications && (profile == null || Boolean.TRUE.equals(profile.getEmailNotificationsEnabled()))
                && emailClient.send(user.getEmail(), title, message)) {
            notification.setSentViaEmail(true);
        }
        if (wantsNotifications && (profile == null || Boolean.TRUE.equals(profile.getSmsNotificationsEnabled()))
                && smsClient.send(user.getPhoneNumber(), message)) {
            notification.setSentViaSms(true);
        }

        notificationRepository.save(notification);
    }

    public List<NotificationDto> getMyNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public NotificationDto markRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("Notification does not belong to this user");
        }

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
        return mapToDto(notification);
    }

    private NotificationDto mapToDto(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(notification.getId());
        dto.setType(notification.getType().name());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setActionUrl(notification.getActionUrl());
        dto.setRead(notification.getRead());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }
}
