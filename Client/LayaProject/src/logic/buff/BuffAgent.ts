import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { ISceneObjModule } from "../sceneObj/ISceneObjModule";
import type { CreatureSceneObj } from "../sceneObj/CreatureSceneObj";
import { SkillMgr } from "../skill/SkillMgr";
import { DamageContext } from "../damage/DamageContext";
import { BuffRuntime } from "./BuffRuntime";

export class BuffAgent implements ISceneObjModule {
    private _owner: CreatureSceneObj | null = null;
    private readonly _buffMap: Map<number, BuffRuntime> = new Map();

    onAttach(owner: BaseSceneObj): void {
        this._owner = owner as CreatureSceneObj;
    }

    onDetach(_owner: BaseSceneObj): void {
        this.clear();
        this._owner = null;
    }

    reset(): void {
        this.clear();
    }

    onOwnerFixedUpdate(_owner: BaseSceneObj, curTime: number): void {
        this.update(curTime);
    }

    onRecycle(): void {
        this.clear();
    }

    onDispose(): void {
        this.clear();
        this._owner = null;
    }

    addBuff(buffId: number, caster: BaseSceneObj, stack: number, durationOverride: number, curTime: number): boolean {
        const owner = this._owner;
        if (!owner || owner.isRelease || owner.isDead) return false;

        const info = SkillMgr.instance.getBuff(buffId);
        if (!info) return false;

        let runtime = this._buffMap.get(buffId);
        if (runtime) {
            runtime.refresh(caster, stack, curTime);
            return true;
        }

        runtime = new BuffRuntime(
            info,
            caster,
            owner,
            stack,
            curTime,
            durationOverride
        );
        this._buffMap.set(buffId, runtime);
        return true;
    }

    removeBuff(buffId: number, curTime: number = this.getDefaultTime()): void {
        const runtime = this._buffMap.get(buffId);
        if (!runtime) return;

        runtime.dispose(curTime);
        this._buffMap.delete(buffId);
    }

    hasBuff(buffId: number): boolean {
        return this._buffMap.has(buffId);
    }

    clear(): void {
        const curTime = this.getDefaultTime();
        this._buffMap.forEach(runtime => runtime.dispose(curTime));
        this._buffMap.clear();
    }

    onBeforeDamage(context: DamageContext): void {
        this._buffMap.forEach(runtime => runtime.onBeforeDamage(context));
    }

    onAfterDamage(context: DamageContext): void {
        this._buffMap.forEach(runtime => runtime.onAfterDamage(context));
    }

    onBeforeBeDamaged(context: DamageContext): void {
        this._buffMap.forEach(runtime => runtime.onBeforeBeDamaged(context));
    }

    onAfterBeDamaged(context: DamageContext): void {
        this._buffMap.forEach(runtime => runtime.onAfterBeDamaged(context));
    }

    private update(curTime: number): void {
        const owner = this._owner;
        if (!owner || owner.isRelease || owner.isDead) {
            this.clear();
            return;
        }

        this._buffMap.forEach((runtime, buffId) => {
            const alive = runtime.update(curTime);
            if (!alive) {
                runtime.dispose(curTime);
                this._buffMap.delete(buffId);
            }
        });
    }

    private getDefaultTime(): number {
        return this._owner?.scene?.curTime ?? 0;
    }
}
