import {
    BulletData,
    DamageData,
    SkillData,
    BuffData,
} from "./SkillData";
import type { BaseAction } from "../action/BaseAction";

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
    constructor(readonly data: SkillData, readonly actions: BaseAction[]) {}
}

export class BulletInfo {
    constructor(readonly data: BulletData, readonly onHitActions: BaseAction[]) {}
}

export class DamageInfo {
    constructor(readonly data: DamageData) {}
}

export class BuffInfo {
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
        this.attrAdds = SkillConfigParser.parseAttrModifierList(data.AttrAdd);
        this.attrPercents = SkillConfigParser.parseAttrModifierList(data.AttrPercent);
        this.onAddActions = actions.onAddActions;
        this.onTickActions = actions.onTickActions;
        this.onRemoveActions = actions.onRemoveActions;
    }

    get durationMs(): number {
        return Math.max(0, Number(this.data.Duration) || 0);
    }

    get tickIntervalMs(): number {
        return Math.max(0, Number(this.data.TickInterval) || 0);
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
