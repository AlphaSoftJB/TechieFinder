package com.techiefinder.service.notification;

import com.techiefinder.model.notification.Notification;
import com.techiefinder.model.user.User;
import com.techiefinder.model.user.UserProfile;
import com.techiefinder.repository.notification.NotificationRepository;
import com.techiefinder.repository.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Confirms NotificationService actually flips sentViaEmail once a real email
 * channel is configured, and that the in-app notification row is still saved
 * regardless -- delivery is additive, never a precondition for the core
 * in-app notification feature.
 */
@SpringBootTest
// A distinct spring.datasource.url keeps this test's Spring context (which differs
// from the default context due to the property override below) from colliding with
// other contexts over the same named/shared H2 in-memory database.
// management.health.mail.enabled=false: Actuator's mail health indicator wants a
// real JavaMailSenderImpl bean; @MockBean-ing JavaMailSender below leaves it with
// none, which fails context startup ("Beans must not be empty") unless disabled.
@TestPropertySource(properties = {
        "spring.mail.username=real-sender@techiefinder.com",
        "spring.datasource.url=jdbc:h2:mem:test-notify-${random.uuid}",
        "management.health.mail.enabled=false"
})
@Transactional
class NotificationServiceDeliveryTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JavaMailSender mailSender;

    @Test
    void marksSentViaEmailWhenARealEmailChannelIsConfigured() {
        User user = User.builder()
                .email("notify-" + UUID.randomUUID() + "@example.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Notify")
                .lastName("Test")
                .role(User.UserRole.USER)
                .build();
        user = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .notificationsEnabled(true)
                .emailNotificationsEnabled(true)
                .smsNotificationsEnabled(true)
                .build();
        user.setProfile(profile);
        user = userRepository.save(user);

        notificationService.notify(user, Notification.NotificationType.SYSTEM_ANNOUNCEMENT, "Welcome", "Thanks for joining", null);

        List<Notification> saved = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getSentViaEmail()).isTrue();
        assertThat(saved.get(0).getSentViaSms()).isFalse(); // SMS still unconfigured in this test
    }

    @Test
    void respectsAUsersOptOutOfEmailNotifications() {
        User user = User.builder()
                .email("notify-optout-" + UUID.randomUUID() + "@example.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Notify")
                .lastName("OptOut")
                .role(User.UserRole.USER)
                .build();
        user = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(user)
                .notificationsEnabled(true)
                .emailNotificationsEnabled(false)
                .smsNotificationsEnabled(false)
                .build();
        user.setProfile(profile);
        user = userRepository.save(user);

        notificationService.notify(user, Notification.NotificationType.SYSTEM_ANNOUNCEMENT, "Welcome", "Thanks for joining", null);

        List<Notification> saved = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getSentViaEmail()).isFalse();
    }
}
