import { BaseSceneObj } from "../sceneObj/BaseSceneObj";

export class DamageContext {
    caster: BaseSceneObj | null = null;
    target: BaseSceneObj | null = null;
    casterId: number = 0;
    rawDamage: number = 0;
    finalDamage: number = 0;
    absorbedDamage: number = 0;
    reflectedDamage: number = 0;
    sourceType: string = "";
    sourceId: number = 0;
    curTime: number = 0;
    isCancelled: boolean = false;

    init(
        caster: BaseSceneObj | null,
        target: BaseSceneObj,
        casterId: number,
        damage: number,
        sourceType: string,
        sourceId: number,
        curTime: number
    ): void {
        this.caster = caster;
        this.target = target;
        this.casterId = casterId;
        this.rawDamage = Math.max(0, Math.ceil(Number(damage) || 0));
        this.finalDamage = this.rawDamage;
        this.absorbedDamage = 0;
        this.reflectedDamage = 0;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.curTime = curTime;
        this.isCancelled = false;
    }

    reset(): void {
        this.caster = null;
        this.target = null;
        this.casterId = 0;
        this.rawDamage = 0;
        this.finalDamage = 0;
        this.absorbedDamage = 0;
        this.reflectedDamage = 0;
        this.sourceType = "";
        this.sourceId = 0;
        this.curTime = 0;
        this.isCancelled = false;
    }

    absorb(value: number): number {
        const amount = Math.max(0, Math.min(this.finalDamage, Math.ceil(Number(value) || 0)));
        this.finalDamage -= amount;
        this.absorbedDamage += amount;
        return amount;
    }

    addDamage(value: number): void {
        this.finalDamage = Math.max(0, this.finalDamage + Math.ceil(Number(value) || 0));
    }

    multiplyDamage(rate: number): void {
        this.finalDamage = Math.max(0, Math.ceil(this.finalDamage * (Number(rate) || 0)));
    }

    cancel(): void {
        this.isCancelled = true;
        this.finalDamage = 0;
    }
}
