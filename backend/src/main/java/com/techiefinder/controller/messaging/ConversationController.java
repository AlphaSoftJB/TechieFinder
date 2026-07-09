package com.techiefinder.controller.messaging;

import com.techiefinder.dto.messaging.ConversationDto;
import com.techiefinder.dto.messaging.MessageDto;
import com.techiefinder.dto.messaging.MessageRequest;
import com.techiefinder.security.CustomUserDetails;
import com.techiefinder.service.messaging.MessagingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    @Autowired
    private MessagingService messagingService;

    @GetMapping("/my")
    public ResponseEntity<List<ConversationDto>> getMyConversations(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(messagingService.getMyConversations(principal.getId()));
    }

    @PostMapping("/with-technician/{technicianId}")
    public ResponseEntity<ConversationDto> getOrCreateConversation(@AuthenticationPrincipal CustomUserDetails principal,
                                                                      @PathVariable Long technicianId) {
        return ResponseEntity.ok(messagingService.getOrCreateConversation(principal.getId(), technicianId));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageDto>> getMessages(@AuthenticationPrincipal CustomUserDetails principal,
                                                          @PathVariable Long id) {
        return ResponseEntity.ok(messagingService.getMessages(id, principal.getId()));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<MessageDto> sendMessage(@AuthenticationPrincipal CustomUserDetails principal,
                                                    @PathVariable Long id,
                                                    @Valid @RequestBody MessageRequest request) {
        return ResponseEntity.ok(messagingService.sendMessage(id, principal.getId(), request.getContent()));
    }
}
