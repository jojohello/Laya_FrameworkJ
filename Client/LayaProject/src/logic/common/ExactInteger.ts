export type IntegerString = string;
export type ExactIntegerInput = IntegerString | number | bigint | null | undefined;

const INTEGER_PATTERN = /^(0|[1-9]\d*)$/;

export function normalizeNonNegativeInteger(value: ExactIntegerInput): IntegerString {
    if (typeof value === "bigint") return value >= 0n ? value.toString() : "0";
    if (typeof value === "number") {
        if (!Number.isSafeInteger(value) || value < 0) return "0";
        return value.toString();
    }
    const text = String(value ?? "").trim();
    return INTEGER_PATTERN.test(text) ? text : "0";
}

export function toNonNegativeBigInt(value: ExactIntegerInput): bigint {
    return BigInt(normalizeNonNegativeInteger(value));
}

export function exactModuloRatio(value: ExactIntegerInput, modulus: number): number {
    if (!Number.isSafeInteger(modulus) || modulus <= 0) return 0;
    const base = BigInt(modulus);
    return Number(toNonNegativeBigInt(value) % base) / modulus;
}

export function formatCompactInteger(value: ExactIntegerInput): string {
    const amount = toNonNegativeBigInt(value);
    const units = ["", "K", "M", "B", "T", "Qa", "Qi"];
    let unitIndex = 0;
    let divisor = 1n;
    while (unitIndex + 1 < units.length && amount >= divisor * 1000n) {
        divisor *= 1000n;
        unitIndex++;
    }
    if (unitIndex === 0) return amount.toString();
    if (unitIndex + 1 === units.length && amount >= divisor * 1000n) {
        const digits = amount.toString();
        return `${digits[0]}.${digits.slice(1, 3)}e${digits.length - 1}`;
    }
    const whole = amount / divisor;
    const decimal = (amount % divisor) * 10n / divisor;
    return decimal === 0n ? `${whole}${units[unitIndex]}` : `${whole}.${decimal}${units[unitIndex]}`;
}
