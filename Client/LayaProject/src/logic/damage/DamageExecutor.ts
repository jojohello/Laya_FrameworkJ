import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { DamageContext } from "./DamageContext";

export interface DamageApplyOptions {
    caster?: BaseSceneObj | null;
    casterId?: number;
    target: BaseSceneObj;
    damage: number;
    sourceType?: string;
    sourceId?: number;
    curTime?: number;
}

export class DamageExecutor {
    private static readonly CONTEXT_STACK_SIZE: number = 8;
    private static readonly _contexts: DamageContext[] = DamageExecutor.createContextStack();
    private static _depth: number = 0;

    static apply(options: DamageApplyOptions): number {
        const target = options.target;
        const damage = Math.max(0, Math.ceil(Number(options.damage) || 0));
        if (!target || target.isRelease || target.isDead || damage <= 0) return 0;

        const caster = options.caster || null;
        const casterId = options.casterId || (caster ? caster.getCasterId() : 0);
        const ctx = this.acquireContext();
        ctx.init(
            caster,
            target,
            casterId,
            damage,
            options.sourceType || "",
            options.sourceId || 0,
            options.curTime !== undefined ? options.curTime : target.scene?.curTime ?? 0
        );

        try {
            this.callBuffHook(caster, "onBeforeDamage", ctx);
            this.callBuffHook(target, "onBeforeBeDamaged", ctx);

            if (!ctx.isCancelled && ctx.finalDamage > 0) {
                this.applyHpDamage(target, ctx);
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

        target.getDamage(ctx.casterId, ctx.finalDamage);
    }

    private static callBuffHook(owner: BaseSceneObj | null, hookName: string, ctx: DamageContext): void {
        const obj = owner as any;
        if (!obj || typeof obj.getBuffAgentForDamage !== "function") return;

        const buffAgent = obj.getBuffAgentForDamage();
        const hook = buffAgent ? buffAgent[hookName] : null;
        if (typeof hook === "function") {
            hook.call(buffAgent, ctx);
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
