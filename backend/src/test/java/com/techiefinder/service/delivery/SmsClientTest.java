package com.techiefinder.service.delivery;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@SpringBootTest
// A distinct spring.datasource.url keeps this test's Spring context (which differs
// from the default context due to the property override below) from colliding with
// other contexts over the same named/shared H2 in-memory database.
@TestPropertySource(properties = {
        "sms.api.key=real-test-termii-key",
        "spring.datasource.url=jdbc:h2:mem:test-sms-${random.uuid}"
})
class SmsClientTest {

    @Autowired
    private SmsClient smsClient;

    @Autowired
    private RestTemplate restTemplate;

    @Test
    void sendsARealSmsOnceARealApiKeyIsConfigured() {
        assertThat(smsClient.isConfigured()).isTrue();

        MockRestServiceServer mockServer = MockRestServiceServer.createServer(restTemplate);
        mockServer.expect(requestTo("https://api.ng.termii.com/api/sms/send"))
                .andExpect(method(org.springframework.http.HttpMethod.POST))
                .andRespond(withSuccess("{\"message_id\":\"123\",\"code\":\"ok\"}", MediaType.APPLICATION_JSON));

        boolean sent = smsClient.send("08012345678", "Your booking is confirmed.");
        assertThat(sent).isTrue();
        mockServer.verify();
    }
}
