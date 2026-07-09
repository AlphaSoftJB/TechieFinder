package com.techiefinder.service.payment.gateway;

public class GatewayInitResult {
    private final String authorizationUrl;
    private final String gatewayReference;

    public GatewayInitResult(String authorizationUrl, String gatewayReference) {
        this.authorizationUrl = authorizationUrl;
        this.gatewayReference = gatewayReference;
    }

    public String getAuthorizationUrl() {
        return authorizationUrl;
    }

    public String getGatewayReference() {
        return gatewayReference;
    }
}
