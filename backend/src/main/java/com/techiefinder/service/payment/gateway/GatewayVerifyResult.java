package com.techiefinder.service.payment.gateway;

import java.math.BigDecimal;

public class GatewayVerifyResult {
    private final boolean success;
    private final String reference;
    private final BigDecimal amount;
    private final String rawStatus;

    public GatewayVerifyResult(boolean success, String reference, BigDecimal amount, String rawStatus) {
        this.success = success;
        this.reference = reference;
        this.amount = amount;
        this.rawStatus = rawStatus;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getReference() {
        return reference;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getRawStatus() {
        return rawStatus;
    }
}
