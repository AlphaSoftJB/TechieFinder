package com.techiefinder.service.delivery;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@SpringBootTest
// A distinct spring.datasource.url keeps this test's Spring context (which differs
// from the default context due to the property override below) from colliding with
// other contexts over the same named/shared H2 in-memory database.
// management.health.mail.enabled=false: Actuator's mail health indicator wants a
// real JavaMailSenderImpl bean; @MockBean-ing JavaMailSender below leaves it with
// none, which fails context startup ("Beans must not be empty") unless disabled.
@TestPropertySource(properties = {
        "spring.mail.username=real-sender@techiefinder.com",
        "spring.datasource.url=jdbc:h2:mem:test-email-${random.uuid}",
        "management.health.mail.enabled=false"
})
class EmailClientTest {

    @Autowired
    private EmailClient emailClient;

    @MockBean
    private JavaMailSender mailSender;

    @Test
    void sendsARealEmailOnceARealFromAddressIsConfigured() {
        assertThat(emailClient.isConfigured()).isTrue();

        boolean sent = emailClient.send("customer@example.com", "Booking confirmed", "Your booking is confirmed.");
        assertThat(sent).isTrue();

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue().getTo()).containsExactly("customer@example.com");
        assertThat(captor.getValue().getSubject()).isEqualTo("Booking confirmed");
        assertThat(captor.getValue().getFrom()).isEqualTo("real-sender@techiefinder.com");
    }
}
