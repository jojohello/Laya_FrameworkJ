package com.jojohello_laya.login.service.impl;

import com.jojohello_laya.login.entity.LoginRecord;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LoginRecordSecurityTest {
    @Test
    void stringRepresentationsRedactAuthenticationAndDeviceData() {
        LoginRecord.LoginRecordBuilder builder = LoginRecord.builder()
                .userId("user-fixture")
                .token("token-fixture")
                .deviceId("device-fixture")
                .clientIp("192.0.2.1")
                .deviceInfo("user-agent-fixture");
        LoginRecord record = builder.build();

        assertRedacted(builder.toString());
        assertRedacted(record.toString());
    }

    private void assertRedacted(String value) {
        assertTrue(value.contains("[REDACTED]"));
        assertFalse(value.contains("token-fixture"));
        assertFalse(value.contains("device-fixture"));
        assertFalse(value.contains("192.0.2.1"));
        assertFalse(value.contains("user-agent-fixture"));
    }
}
