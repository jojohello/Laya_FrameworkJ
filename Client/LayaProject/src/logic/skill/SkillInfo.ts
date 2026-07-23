import {
    BulletData,
    DamageData,
    SkillData,
    BuffData,
} from "./SkillData";
import type { BaseAction } from "../action/BaseAction";

function toNonNegativeSeconds(milliseconds: unknown): number {
    const value = Number(milliseconds);
    return Number.isFinite(value) ? Math.max(0, value) / 1000 : 0;
}

export enum SkillType {
    Active = "Active",
    Passive = "Passive",
}

export enum SkillTargetType {
    None = "None",
    Target = "Target",
    Position = "Position",
    Self = "Self",
}

export enum BulletMoveType {
    Line = "Line",
    Trace = "Trace",
}

export enum BuffStackType {
    Refresh = "Refresh",
    Stack = "Stack",
    Replace = "Replace",
}

export interface SkillAttrModifier {
    attr: string;
    value: number;
}

export interface SkillLevelKey {
    skillId: number;
    level: number;
}

export class SkillInfo {
    readonly cooldownSeconds: number;

    constructor(readonly data: SkillData, readonly actions: BaseAction[]) {
        this.cooldownSeconds = toNonNegativeSeconds(data.CD);
    }
}

export class BulletInfo {
    readonly flyTimeSeconds: number;

    constructor(readonly data: BulletData, readonly onHitActions: BaseAction[]) {
        const flyTimeMs = Number(data.FlyTime);
        this.flyTimeSeconds = Number.isFinite(flyTimeMs)
            ? (flyTimeMs > 0 ? flyTimeMs / 1000 : flyTimeMs)
            : 0;
    }
}

export class DamageInfo {
    constructor(readonly data: DamageData) {}
}

export class BuffInfo {
    readonly durationSeconds: number;
    readonly tickIntervalSeconds: number;
    readonly attrAdds: SkillAttrModifier[];
    readonly attrPercents: SkillAttrModifier[];
    readonly onAddActions: BaseAction[];
    readonly onTickActions: BaseAction[];
    readonly onRemoveActions: BaseAction[];

    constructor(readonly data: BuffData, actions: {
        onAddActions: BaseAction[];
        onTickActions: BaseAction[];
        onRemoveActions: BaseAction[];
    }) {
        this.durationSeconds = toNonNegativeSeconds(data.Duration);
        this.tickIntervalSeconds = toNonNegativeSeconds(data.TickInterval);
        this.attrAdds = SkillConfigParser.parseAttrModifierList(data.AttrAdd);
        this.attrPercents = SkillConfigParser.parseAttrModifierList(data.AttrPercent);
        this.onAddActions = actions.onAddActions;
        this.onTickActions = actions.onTickActions;
        this.onRemoveActions = actions.onRemoveActions;
    }

    get maxStack(): number {
        return Math.max(1, Number(this.data.MaxStack) || 1);
    }

    get stackType(): BuffStackType {
        const value = this.data.StackType as BuffStackType;
        return value || BuffStackType.Refresh;
    }
}

export class SkillConfigParser {
    static makeSkillLevelKey(skillId: number, level: number): string {
        return `${skillId}_${level}`;
    }

    static parseAttrModifierList(value: string): SkillAttrModifier[] {
        if (!value) return [];

        const ret: SkillAttrModifier[] = [];
        const list = value.split(/[|,;]/);
        for (const item of list) {
            const [attr, rawValue] = item.split(":");
            if (!attr || rawValue === undefined) continue;

            const num = Number(rawValue.trim());
            if (attr.trim() && isFinite(num) && num !== 0) {
                ret.push({ attr: attr.trim(), value: num });
            }
        }
        return ret;
    }
}
