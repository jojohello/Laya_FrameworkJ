import { BaseScene } from "../scene/BaseScene";
import { ConfigMgr } from "../config/ConfigMgr";
import { SceneLayerType } from "../scene/SceneLayerType";
import { SkillAgent } from "../skill/SkillAgent";
import { BuffAgent } from "../buff/BuffAgent";
import { DamageContext } from "../damage/DamageContext";
import { DamageExecutor } from "../damage/DamageExecutor";
import { AttributeSet } from "./AttributeSet";
import { BaseSceneObj } from "./BaseSceneObj";
import { DisplaySceneObj } from "./DisplaySceneObj";
import { HudHealthBarModule } from "./HudHealthBarModule";
import { SceneObjConfigData } from "./SceneObjConfigData";
import { SceneObjType } from "./SceneObjType";

const { regClass } = Laya;

/**
 * Creature scene object with attributes, health, hud and skill extension points.
 */
@regClass()
export class CreatureSceneObj extends DisplaySceneObj {
    protected _displayLayerType: SceneLayerType = SceneLayerType.Object;
    protected _attrs: AttributeSet = new AttributeSet();
    protected _healthBarOffsetY: number = -70;

    getObjType(): number {
        return SceneObjType.Monster;
    }

    protected onInit(uid: number, cfgId: number, scene: BaseScene, team: number, x: number, y: number, angle: number): void {
        this._isDead = false;
        this.initDefaultAttrs();
        this.applyConfigAttrs(cfgId);
        this.setCollisionBox(20);
    }

    protected onFixedUpdate(curTime: number): void {
        this.onSkillUpdate(curTime);
    }

    get attrs(): AttributeSet {
        return this._attrs;
    }

    get hp(): number {
        return this._attrs.getValue("HP");
    }

    get maxHp(): number {
        return this._attrs.getFinal("maxHP", 1);
    }

    setMaxHp(value: number): void {
        const oldMaxHp = this._attrs.getFinal("maxHP", 0);
        const oldHp = this._attrs.getValue("HP", oldMaxHp);
        this._attrs.setBase("maxHP", value);
        const delta = this.maxHp - oldMaxHp;
        this._attrs.setValue("HP", Math.min(this.maxHp, Math.max(0, oldHp + delta)));
        this.refreshHealthBar();
    }

    showHealthBar(show: boolean = true): void {
        if (!show) {
            this.getHudHealthBarModule().hide();
            return;
        }

        this.getHudHealthBarModule().show({
            offsetY: this._healthBarOffsetY,
        });
        this.refreshHealthBar();
    }

    getDamage(casterId: number, damage: number): void {
        DamageExecutor.apply({
            casterId,
            target: this,
            damage,
            sourceType: "direct",
        });
    }

    applyDamageContext(context: DamageContext): void {
        if (this._isDead || context.finalDamage <= 0) return;

        const nextHp = Math.max(0, this.hp - context.finalDamage);
        this._attrs.setValue("HP", nextHp);
        this.refreshHealthBar();
        this.onDamaged(context.casterId, context.finalDamage);

        if (nextHp <= 0) {
            this.die(context.casterId);
        }
    }

    heal(value: number): void {
        if (this._isDead || value <= 0) return;
        this._attrs.setValue("HP", Math.min(this.maxHp, this.hp + value));
        this.refreshHealthBar();
    }

    castSkill(skillId: number, targetId: number = 0, x: number = this.x, y: number = this.y, skillLevel: number = 1): boolean {
        const success = this.getSkillAgent().castSkill(skillId, skillLevel, targetId, x, y);
        this.onCastSkill(skillId, targetId, x, y);
        return success;
    }

    canCastSkill(skillId: number): boolean {
        return this.getSkillAgent().canCast(skillId);
    }

    getSkillCooldownRemain(skillId: number): number {
        return this.getSkillAgent().getCooldownRemain(skillId);
    }

    addBuff(buffId: number, caster: BaseSceneObj, stack: number = 1, durationOverride: number = 0, curTime: number = this.scene?.curTime ?? 0): boolean {
        return this.getBuffAgent().addBuff(buffId, caster, stack, durationOverride, curTime);
    }

    removeBuff(buffId: number): void {
        this.getBuffAgent().removeBuff(buffId);
    }

    hasBuff(buffId: number): boolean {
        return this.getBuffAgent().hasBuff(buffId);
    }

    reset(): void {
        super.reset();
        this._attrs.clear();
    }

    onRecycle(scene: BaseScene): void {
        super.onRecycle(scene);
        this._attrs.clear();
    }

    onDispose(scene: BaseScene): void {
        super.onDispose(scene);
        this._attrs.clear();
    }

    protected initDefaultAttrs(): void {
        this._attrs.markDirectAttr("HP");
        this._attrs.bindPercentAttr("maxHP", "maxHPPercent");
        this.setMaxHp(100);
    }

    protected applyConfigAttrs(cfgId: number): void {
        const config = ConfigMgr.instance.getConfig<SceneObjConfigData>("SceneObjConfig", cfgId);
        if (!config) return;

        this.setMaxHp(Number(config.hp) || 100);
        this._attrs.setBase("speed", Number(config.speed) || 0);
        this._attrs.setBase("attack", Number(config.attack) || 0);
        this._attrs.setBase("defense", Number(config.defense) || 0);
    }

    protected die(casterId: number): void {
        if (this._isDead) return;
        this._isDead = true;
        this.setCollisionBoxEnabled(false);
        this.onDead(casterId);
        this.release();
    }

    protected refreshHealthBar(): void {
        const module = this.getModule(HudHealthBarModule);
        if (module) {
            module.refresh();
        }
    }

    protected updateHealthBarPos(): void {
        const module = this.getModule(HudHealthBarModule);
        if (module) {
            module.onOwnerConfirmPos?.(this);
        }
    }

    protected getSkillAgent(): SkillAgent {
        let agent = this.getModule(SkillAgent);
        if (!agent) {
            agent = new SkillAgent();
            this.addModule(agent);
        }
        return agent;
    }

    protected getBuffAgent(): BuffAgent {
        let agent = this.getModule(BuffAgent);
        if (!agent) {
            agent = new BuffAgent();
            this.addModule(agent);
        }
        return agent;
    }

    protected getHudHealthBarModule(): HudHealthBarModule {
        let module = this.getModule(HudHealthBarModule);
        if (!module) {
            module = new HudHealthBarModule();
            this.addModule(module);
        }
        return module;
    }

    getBuffAgentForDamage(): BuffAgent {
        return this.getBuffAgent();
    }

    protected onConfirmPos(): void {
        this.updateHealthBarPos();
    }

    protected onDamaged(casterId: number, damage: number): void {}
    protected onDead(casterId: number): void {}
    protected onCastSkill(skillId: number, targetId: number, x: number, y: number): void {}
    protected onSkillUpdate(curTime: number): void {}
}
