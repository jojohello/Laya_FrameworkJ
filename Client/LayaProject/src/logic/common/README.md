# Logic Common

`logic/common` contains small cross-module contracts and utilities that do not own an independent lifecycle.

## Exact integers

Use `ExactInteger.ts` whenever a protocol field may exceed JavaScript's safe integer range.

| Value kind | Server/database | JSON wire | Client runtime |
| --- | --- | --- | --- |
| Local or cross-service ID | `long` / `BIGINT` | decimal string | string; parse to `bigint` only for numeric comparison |
| Experience, wallet, cumulative counters | checked `long` / `BIGINT` | decimal string | `bigint` |
| Bounded level, stamina, stack count | `int` or checked `long` | number | number |
| Explicitly beyond 64-bit | `BigInteger` / `DECIMAL(65,0)` | decimal string | `bigint` |

Do not construct a global role ID by concatenating or multiplying `gameServerId` and `playerId`. Keep them as a structured pair.

### Adding a new exact field

1. Decide and document whether the value is bounded below `Number.MAX_SAFE_INTEGER`.
2. For an exact 64-bit value, store it as `BIGINT`, use Java `long`, and apply checked arithmetic through the server numeric helper.
3. Serialize it as a non-negative decimal string; do not rely on Jackson emitting a JSON number safely.
4. Type the client DTO as `IntegerString`, normalize input with `normalizeNonNegativeInteger`, and use `toNonNegativeBigInt` for arithmetic.
5. Convert only a proven-safe remainder or ratio to `number` for rendering.
6. Test zero, the JavaScript safe-integer boundary, `Long.MAX_VALUE`, negative rejection, and overflow rejection.

`formatCompactInteger` formats exact values for UI without first converting the full value to `number`. `exactModuloRatio` is intended for progress bars where only a small modulus is required.
