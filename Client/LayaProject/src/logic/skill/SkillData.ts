/**
 * Skill module config row data.
 *
 * Data classes/interfaces only contain primitive fields so they remain safe for
 * serialization and config export.
 */

export interface SkillData {
    ID: number;
    SkillID: number;
    Level: number;
    Name: string;
    MaxLevel: number;
    SkillType: string;
    TargetType: string;
    CastRange: number;
    CD: number;
    CostType: string;
    CostValue: number;
    Action: string;
    /** Optional for compatibility with older client config snapshots and test fixtures. */
    ClientAction?: string;
    Desc: string;
}

export interface BulletData {
    ID: number;
    MoveType: string;
    Speed: number;
    Range: number;
    PenetrateCount: number;
    FlyTime: number;
    CheckCollision: boolean;
    Resource: string;
    OnHitAction: string;
    /** Optional for compatibility with older client config snapshots and test fixtures. */
    ClientOnHitAction?: string;
}

export interface DamageData {
    ID: number;
    BaseDamage: number;
    AttackRate: number;
    FormulaID: number;
    DamageType: string;
    ElementType: string;
}

export interface BuffData {
    ID: number;
    Duration: number;
    TickInterval: number;
    MaxStack: number;
    StackType: string;
    AttrAdd: string;
    AttrPercent: string;
    OnAddAction: string;
    OnTickAction: string;
    OnRemoveAction: string;
    Desc: string;
}
