import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { DEFAULT_HIT_EFFECT_ID, EffectSceneObj } from "../sceneObj/EffectSceneObj";
import { CombatFeedbackMgr } from "../combatFeedback/CombatFeedbackMgr";
import { DamageContext } from "./DamageContext";
import { DAMAGE_DEFENSE_CONSTANT, DamageType, normalizeDamageType } from "./DamageType";

export interface DamageApplyOptions {
    casterId: number;
    target: BaseSceneObj;
    damage: number;
    damageType?: DamageType | string;
    elementType?: string;
    sourceType?: string;
    sourceId?: number;
    /** Config/Action-selected hit effect. Undefined uses the shared default; 0 disables it. */
    hitEffectId?: number;
    curTime: number;
}

export class DamageExecutor {
    private static readonly CONTEXT_STACK_SIZE: number = 8;
    private static readonly _contexts: DamageContext[] = DamageExecutor.createContextStack();
    private static _depth: number = 0;

    static apply(options: DamageApplyOptions): number {
        const target = options.target;
        const damage = Math.max(0, Number(options.damage) || 0);
        if (!target || target.isRelease || target.isDead || damage <= 0) return 0;

        const casterId = options.casterId;
        const caster = target.scene?.getLiveObject(casterId) || null;
        if (casterId > 0 && !caster) return 0;
        const ctx = this.acquireContext();
        ctx.init(
            caster,
            target,
            casterId,
            damage,
            normalizeDamageType(options.damageType),
            options.elementType || "None",
            options.sourceType || "",
            options.sourceId || 0,
            options.curTime
        );

        try {
            this.applyDefenseMitigation(target, ctx);
            this.callBuffHook(caster, "onBeforeDamage", ctx);
            this.callBuffHook(target, "onBeforeBeDamaged", ctx);

            const resolvedDamage = ctx.resolveFinalDamage();
            ctx.finalDamage = resolvedDamage;
            if (resolvedDamage > 0) {
                // Snapshot display values before damage can release the target; effects never keep entity references.
                const scene = target.scene;
                const team = target.team;
                const x = target.x;
                const y = target.getCombatEffectCenterY();
                this.applyHpDamage(target, ctx);
                CombatFeedbackMgr.instance.showDamage(target, ctx.finalDamage, ctx.curTime);
                const hitEffectId = options.hitEffectId === undefined
                    ? DEFAULT_HIT_EFFECT_ID
                    : Math.max(0, Math.floor(options.hitEffectId));
                if (scene && hitEffectId > 0) {
                    EffectSceneObj.playCombatEffect(scene, hitEffectId, team, x, y, ctx.curTime);
                }
            }

            this.callBuffHook(target, "onAfterBeDamaged", ctx);
            this.callBuffHook(caster, "onAfterDamage", ctx);

            return ctx.finalDamage;
        } finally {
            ctx.reset();
            this._depth--;
        }
    }

    private static acquireContext(): DamageContext {
        if (this._depth >= this._contexts.length) {
            throw new Error("[DamageExecutor] DamageContext stack overflow");
        }

        return this._contexts[this._depth++];
    }

    private static applyHpDamage(target: BaseSceneObj, ctx: DamageContext): void {
        const receiver = target as any;
        if (typeof receiver.applyDamageContext === "function") {
            receiver.applyDamageContext(ctx);
            return;
        }

        target.getDamage(ctx.casterId, ctx.finalDamage, ctx.curTime);
    }

    private static applyDefenseMitigation(target: BaseSceneObj, ctx: DamageContext): void {
        if (ctx.damageType === DamageType.True) return;

        const attrName = ctx.damageType === DamageType.Magic ? "magicDefense" : "defense";
        const attrs = (target as any).attrs;
        const defense = attrs && typeof attrs.get === "function"
            ? Math.max(0, Number(attrs.get(attrName, 0)) || 0)
            : 0;
        const mitigated = ctx.rawDamage * DAMAGE_DEFENSE_CONSTANT / (DAMAGE_DEFENSE_CONSTANT + defense);
        ctx.mitigatedDamage = mitigated;
        ctx.finalDamage = mitigated;
    }

    private static callBuffHook(owner: BaseSceneObj | null, hookName: string, ctx: DamageContext): void {
        const obj = owner as any;
        if (!obj || typeof obj.getBuffAgentForDamage !== "function") return;

        const buffAgent = obj.getBuffAgentForDamage();
        const hook = buffAgent ? buffAgent[hookName] : null;
        if (typeof hook === "function") {
            hook.call(buffAgent, owner, ctx);
        }
    }

    private static createContextStack(): DamageContext[] {
        const list: DamageContext[] = [];
        for (let i = 0; i < DamageExecutor.CONTEXT_STACK_SIZE; i++) {
            list[i] = new DamageContext();
        }
        return list;
    }
}
