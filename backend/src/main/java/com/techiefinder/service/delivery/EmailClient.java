package com.techiefinder.service.delivery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Sends email via the configured SMTP account (spring.mail.*). Without real
 * credentials (the dev placeholders in application.properties), isConfigured()
 * is false and callers should skip sending rather than fail with an SMTP auth error.
 */
@Component
public class EmailClient {

    private static final Logger log = LoggerFactory.getLogger(EmailClient.class);
    private static final String PLACEHOLDER_MARKER = "your-email@gmail.com";

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public boolean isConfigured() {
        return fromAddress != null && !fromAddress.isBlank() && !fromAddress.equals(PLACEHOLDER_MARKER);
    }

    /** Best-effort: returns whether the email was actually sent. */
    public boolean send(String toAddress, String subject, String body) {
        if (!isConfigured() || toAddress == null || toAddress.isBlank()) {
            return false;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toAddress);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            return true;
        } catch (MailException e) {
            log.warn("Email delivery failed", e);
            return false;
        }
    }
}
