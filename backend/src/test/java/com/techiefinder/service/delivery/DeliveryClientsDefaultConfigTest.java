package com.techiefinder.service.delivery;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * With this repo's dev-only placeholder credentials (application.properties),
 * every delivery channel must report itself as unconfigured and no-op safely --
 * this is the fallback behavior that keeps the app usable without real
 * Firebase/SMTP/Termii credentials.
 */
@SpringBootTest
class DeliveryClientsDefaultConfigTest {

    @Autowired
    private PushNotificationClient pushNotificationClient;

    @Autowired
    private EmailClient emailClient;

    @Autowired
    private SmsClient smsClient;

    @Test
    void pushIsUnconfiguredByDefaultAndSendIsANoOp() {
        assertThat(pushNotificationClient.isConfigured()).isFalse();
        assertThat(pushNotificationClient.send("some-fcm-token", "Title", "Body")).isFalse();
    }

    @Test
    void emailIsUnconfiguredByDefaultAndSendIsANoOp() {
        assertThat(emailClient.isConfigured()).isFalse();
        assertThat(emailClient.send("someone@example.com", "Subject", "Body")).isFalse();
    }

    @Test
    void smsIsUnconfiguredByDefaultAndSendIsANoOp() {
        assertThat(smsClient.isConfigured()).isFalse();
        assertThat(smsClient.send("08012345678", "Hello")).isFalse();
    }
}
