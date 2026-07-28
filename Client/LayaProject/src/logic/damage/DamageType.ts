/**
 * Damage schools decide which defensive attribute participates in mitigation.
 * Element is deliberately kept separate: Fire, Ice and similar tags do not
 * introduce an independent resistance system until such a system is designed.
 */
export enum DamageType {
    Physical = "Physical",
    Magic = "Magic",
    True = "True",
}

export const DAMAGE_DEFENSE_CONSTANT: number = 100;
export const STANDARD_DAMAGE_FORMULA_ID: number = 1;

export function isSupportedDamageFormula(formulaId: number): boolean {
    return formulaId === STANDARD_DAMAGE_FORMULA_ID;
}

export function normalizeDamageType(value: string | DamageType | null | undefined): DamageType {
    switch (value) {
        case DamageType.Magic:
            return DamageType.Magic;
        case DamageType.True:
            return DamageType.True;
        case DamageType.Physical:
        case "Normal": // Compatibility with pre-formula configuration.
        default:
            return DamageType.Physical;
    }
}
