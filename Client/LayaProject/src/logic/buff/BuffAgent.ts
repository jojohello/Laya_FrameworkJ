import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { ISceneObjModule } from "../sceneObj/ISceneObjModule";
import type { CreatureSceneObj } from "../sceneObj/CreatureSceneObj";
import { SkillMgr } from "../skill/SkillMgr";
import { DamageContext } from "../damage/DamageContext";
import { BuffRuntime } from "./BuffRuntime";

export class BuffAgent implements ISceneObjModule {
    private readonly _buffMap: Map<number, BuffRuntime> = new Map();

    reset(owner: BaseSceneObj, curTime: number): void {
        this.clear(owner as CreatureSceneObj, curTime);
    }

    onOwnerLogicUpdate(
        owner: BaseSceneObj,
        _logicDt: number,
        curTime: number,
        _tick: number
    ): void {
        this.update(owner as CreatureSceneObj, curTime);
    }

    onRecycle(owner: BaseSceneObj, curTime: number): void {
        this.clear(owner as CreatureSceneObj, curTime);
    }

    onDispose(owner: BaseSceneObj, curTime: number): void {
        this.clear(owner as CreatureSceneObj, curTime);
    }

    addBuff(
        owner: CreatureSceneObj,
        buffId: number,
        casterId: number,
        stack: number,
        durationOverrideSeconds: number,
        curTime: number
    ): boolean {
        if (owner.isRelease || owner.isDead) return false;
        const caster = owner.scene?.getLiveObject(casterId) || null;
        if (!caster) return false;

        const info = SkillMgr.instance.getBuff(buffId);
        if (!info) return false;

        let runtime = this._buffMap.get(buffId);
        if (runtime) {
            runtime.refresh(casterId, owner, stack, curTime);
            return true;
        }

        runtime = new BuffRuntime(
            info,
            casterId,
            owner,
            stack,
            curTime,
            durationOverrideSeconds
        );
        this._buffMap.set(buffId, runtime);
        return true;
    }

    removeBuff(_owner: CreatureSceneObj, buffId: number, curTime: number): void {
        const runtime = this._buffMap.get(buffId);
        if (!runtime) return;

        runtime.dispose(_owner, curTime);
        this._buffMap.delete(buffId);
    }

    hasBuff(buffId: number): boolean {
        return this._buffMap.has(buffId);
    }

    clear(owner: CreatureSceneObj, curTime: number): void {
        this._buffMap.forEach(runtime => runtime.dispose(owner, curTime));
        this._buffMap.clear();
    }

    onBeforeDamage(_owner: BaseSceneObj, context: DamageContext): void {
        this._buffMap.forEach(runtime => runtime.onBeforeDamage(context));
    }

    onAfterDamage(_owner: BaseSceneObj, context: DamageContext): void {
        this._buffMap.forEach(runtime => runtime.onAfterDamage(context));
    }

    onBeforeBeDamaged(_owner: BaseSceneObj, context: DamageContext): void {
        this._buffMap.forEach(runtime => runtime.onBeforeBeDamaged(context));
    }

    onAfterBeDamaged(_owner: BaseSceneObj, context: DamageContext): void {
        this._buffMap.forEach(runtime => runtime.onAfterBeDamaged(context));
    }

    private update(owner: CreatureSceneObj, curTime: number): void {
        if (owner.isRelease || owner.isDead) {
            this.clear(owner, curTime);
            return;
        }

        this._buffMap.forEach((runtime, buffId) => {
            const alive = runtime.update(owner, curTime);
            if (!alive) {
                runtime.dispose(owner, curTime);
                this._buffMap.delete(buffId);
            }
        });
    }
}
