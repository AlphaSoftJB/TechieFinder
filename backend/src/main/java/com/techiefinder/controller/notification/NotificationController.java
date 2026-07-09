package com.techiefinder.controller.notification;

import com.techiefinder.dto.notification.NotificationDto;
import com.techiefinder.security.CustomUserDetails;
import com.techiefinder.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/my")
    public ResponseEntity<List<NotificationDto>> getMyNotifications(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(notificationService.getMyNotifications(principal.getId()));
    }

    @GetMapping("/my/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(principal.getId())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markRead(@AuthenticationPrincipal CustomUserDetails principal,
                                                      @PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markRead(id, principal.getId()));
    }
}
