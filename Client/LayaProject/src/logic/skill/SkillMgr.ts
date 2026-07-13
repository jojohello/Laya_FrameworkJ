import { ConfigMgr } from "../config/ConfigMgr";
import { IManager } from "../core/IManager";
import {
    BuffData,
    BulletData,
    DamageData,
    SkillData,
} from "./SkillData";
import {
    BulletInfo,
    BuffInfo,
    DamageInfo,
    SkillConfigParser,
    SkillInfo,
} from "./SkillInfo";
import { ActionFactory } from "../action/ActionFactory";

export class SkillMgr implements IManager {
    private static _instance: SkillMgr;

    static get instance(): SkillMgr {
        if (!this._instance) this._instance = new SkillMgr();
        return this._instance;
    }

    private static readonly TABLE_SKILL = "Skill";
    private static readonly TABLE_BULLET = "Bullet";
    private static readonly TABLE_DAMAGE = "Damage";
    private static readonly TABLE_BUFF = "Buff";

    private readonly _skillIndex: Map<string, SkillData> = new Map();
    private readonly _skillInfoCache: Map<string, SkillInfo> = new Map();
    private readonly _bulletInfoCache: Map<number, BulletInfo> = new Map();
    private readonly _damageInfoCache: Map<number, DamageInfo> = new Map();
    private readonly _buffInfoCache: Map<number, BuffInfo> = new Map();
    private _levelIndexReady: boolean = false;

    private constructor() {}

    init(): void {
        this.reset();
    }

    update(_dt: number): void {
    }

    reset(): void {
        this._skillIndex.clear();
        this._skillInfoCache.clear();
        this._bulletInfoCache.clear();
        this._damageInfoCache.clear();
        this._buffInfoCache.clear();
        this._levelIndexReady = false;
    }

    release(): void {
        this.reset();
    }

    getSkill(skillId: number, level: number): SkillInfo | null {
        const key = SkillConfigParser.makeSkillLevelKey(skillId, level);
        const cached = this._skillInfoCache.get(key);
        if (cached) return cached;

        const data = this.getSkillData(skillId, level);
        if (!data) return null;

        const info = new SkillInfo(data, ActionFactory.parseActions(data.Action, true));
        this._skillInfoCache.set(key, info);
        return info;
    }

    getSkillLevel(skillId: number, level: number): SkillInfo | null {
        return this.getSkill(skillId, level);
    }

    getBullet(bulletId: number): BulletInfo | null {
        const cached = this._bulletInfoCache.get(bulletId);
        if (cached) return cached;

        const data = ConfigMgr.instance.getConfig<BulletData>(SkillMgr.TABLE_BULLET, bulletId);
        if (!data) return null;

        const info = new BulletInfo(data, ActionFactory.parseActions(data.OnHitAction, false));
        this._bulletInfoCache.set(bulletId, info);
        return info;
    }

    getDamage(damageId: number): DamageInfo | null {
        const cached = this._damageInfoCache.get(damageId);
        if (cached) return cached;

        const data = ConfigMgr.instance.getConfig<DamageData>(SkillMgr.TABLE_DAMAGE, damageId);
        if (!data) return null;

        const info = new DamageInfo(data);
        this._damageInfoCache.set(damageId, info);
        return info;
    }

    getBuff(buffId: number): BuffInfo | null {
        const cached = this._buffInfoCache.get(buffId);
        if (cached) return cached;

        const data = ConfigMgr.instance.getConfig<BuffData>(SkillMgr.TABLE_BUFF, buffId);
        if (!data) return null;

        const info = new BuffInfo(data, {
            onAddActions: ActionFactory.parseActions(data.OnAddAction, false),
            onTickActions: ActionFactory.parseActions(data.OnTickAction, false),
            onRemoveActions: ActionFactory.parseActions(data.OnRemoveAction, false),
        });
        this._buffInfoCache.set(buffId, info);
        return info;
    }

    private getSkillData(skillId: number, level: number): SkillData | null {
        this.ensureLevelIndex();
        return this._skillIndex.get(SkillConfigParser.makeSkillLevelKey(skillId, level)) || null;
    }

    private ensureLevelIndex(): void {
        if (this._levelIndexReady) return;

        this._skillIndex.clear();
        const skills = ConfigMgr.instance.getConfigTable<SkillData>(SkillMgr.TABLE_SKILL);
        for (const data of skills) {
            this._skillIndex.set(SkillConfigParser.makeSkillLevelKey(data.SkillID, data.Level), data);
        }

        this._levelIndexReady = true;
    }
}
