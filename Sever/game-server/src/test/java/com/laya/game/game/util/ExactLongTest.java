package com.laya.game.game.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ExactLongTest {
    @Test
    void addsWithoutLosingPrecision() {
        assertEquals(Long.MAX_VALUE, ExactLong.addNonNegative(Long.MAX_VALUE - 1, 1, "test"));
    }

    @Test
    void rejectsOverflowAndNegativeResults() {
        assertThrows(IllegalStateException.class,
                () -> ExactLong.addNonNegative(Long.MAX_VALUE, 1, "test"));
        assertThrows(IllegalStateException.class,
                () -> ExactLong.addNonNegative(0, -1, "test"));
    }

    @Test
    void serializesLongAsDecimalString() {
        assertEquals("9223372036854775807", ExactLong.toWire(Long.MAX_VALUE));
    }
}
