package com.techiefinder.service.delivery;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Sends push notifications via Firebase Cloud Messaging when a real service
 * account is configured at firebase.config.path. Without one (the default --
 * no file ships in this repo, since it's a real Google Cloud credential),
 * isConfigured() is false and callers should skip sending rather than fail.
 */
@Component
public class PushNotificationClient {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationClient.class);

    private final ResourceLoader resourceLoader = new DefaultResourceLoader();

    @Value("${firebase.config.path}")
    private String configPath;

    private FirebaseMessaging messaging;

    @PostConstruct
    void init() {
        Resource resource = resourceLoader.getResource(configPath);
        if (!resource.exists()) {
            log.info("No Firebase service account found at {} -- push notifications are disabled.", configPath);
            return;
        }
        try {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(resource.getInputStream()))
                    .build();
            FirebaseApp app = FirebaseApp.getApps().isEmpty()
                    ? FirebaseApp.initializeApp(options)
                    : FirebaseApp.getInstance();
            messaging = FirebaseMessaging.getInstance(app);
        } catch (IOException e) {
            log.warn("Could not initialize Firebase from {} -- push notifications are disabled.", configPath, e);
        }
    }

    public boolean isConfigured() {
        return messaging != null;
    }

    /** Best-effort: returns whether the push was actually sent. */
    public boolean send(String fcmToken, String title, String body) {
        if (!isConfigured() || fcmToken == null || fcmToken.isBlank()) {
            return false;
        }
        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                    .build();
            messaging.send(message);
            return true;
        } catch (FirebaseMessagingException e) {
            log.warn("Push notification failed", e);
            return false;
        }
    }
}
