package com.laya.game.game.util;

public final class ExactLong {
    public static final long MAX_JAVASCRIPT_SAFE_INTEGER = 9_007_199_254_740_991L;

    private ExactLong() {
    }

    public static long addNonNegative(long current, long delta, String fieldName) {
        final long result;
        try {
            result = Math.addExact(current, delta);
        } catch (ArithmeticException exception) {
            throw new IllegalStateException(fieldName + " overflow", exception);
        }
        if (result < 0) throw new IllegalStateException(fieldName + " cannot become negative");
        return result;
    }

    public static long requireJavaScriptSafeNonNegative(long value, String fieldName) {
        if (value < 0 || value > MAX_JAVASCRIPT_SAFE_INTEGER) {
            throw new IllegalStateException(fieldName + " exceeds JavaScript safe integer range");
        }
        return value;
    }

    public static String toWire(long value) {
        if (value < 0) throw new IllegalArgumentException("wire integer cannot be negative");
        return Long.toString(value);
    }
}
