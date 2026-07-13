import { BaseScene } from "../scene/BaseScene";
import { CreatureSceneObj } from "../sceneObj/CreatureSceneObj";

export interface SkillDebugScenarioResult {
    caster: CreatureSceneObj;
    target: CreatureSceneObj;
    skillId: number;
    skillLevel: number;
    castSuccess: boolean;
    expectedDamage: number;
}

export class SkillDebugScenario {
    static readonly TEST_SKILL_ID: number = 1001;
    static readonly TEST_BUFF_ID: number = 3001;

    static castTestFireball(scene: BaseScene, skillLevel: number = 1, x: number = 300, y: number = 300): SkillDebugScenarioResult | null {
        const caster = scene.addObjectToScene("CreatureSceneObj", 4001, 1, x, y, 0) as CreatureSceneObj | null;
        const target = scene.addObjectToScene("CreatureSceneObj", 1001, 2, x + 220, y, 0) as CreatureSceneObj | null;

        if (!caster || !target) {
            if (caster) caster.release();
            if (target) target.release();
            console.error("[SkillDebugScenario] create test objects failed");
            return null;
        }

        caster.attrs.setBase("attack", 20);
        caster.setMaxHp(100);
        target.setMaxHp(200);

        const castSuccess = caster.castSkill(
            SkillDebugScenario.TEST_SKILL_ID,
            target.uid,
            target.x,
            target.y,
            skillLevel
        );

        return {
            caster,
            target,
            skillId: SkillDebugScenario.TEST_SKILL_ID,
            skillLevel,
            castSuccess,
            expectedDamage: skillLevel >= 2 ? 84 : 50,
        };
    }

    static applyTestBurnBuff(scene: BaseScene, x: number = 300, y: number = 420): SkillDebugScenarioResult | null {
        const caster = scene.addObjectToScene("CreatureSceneObj", 4001, 1, x, y, 0) as CreatureSceneObj | null;
        const target = scene.addObjectToScene("CreatureSceneObj", 1001, 2, x + 160, y, 0) as CreatureSceneObj | null;

        if (!caster || !target) {
            if (caster) caster.release();
            if (target) target.release();
            console.error("[SkillDebugScenario] create buff test objects failed");
            return null;
        }

        caster.attrs.setBase("attack", 20);
        target.setMaxHp(200);

        target.addBuff(SkillDebugScenario.TEST_BUFF_ID, caster, 1, 3000, Laya.timer.currTimer);

        return {
            caster,
            target,
            skillId: 0,
            skillLevel: 0,
            castSuccess: target.hasBuff(SkillDebugScenario.TEST_BUFF_ID),
            expectedDamage: 50,
        };
    }
}
