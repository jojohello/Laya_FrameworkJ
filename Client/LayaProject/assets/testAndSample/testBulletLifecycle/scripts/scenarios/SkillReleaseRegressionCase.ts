import { SkillAgent } from "../../../../../src/logic/skill/SkillAgent";
import { SkillMgr } from "../../../../../src/logic/skill/SkillMgr";
import { SkillInfo } from "../../../../../src/logic/skill/SkillInfo";
import { assertHeadless, HeadlessTestCase } from "../HeadlessTestRunner";
import {
    createHeadlessCountingAction,
    HeadlessTestWorld,
    registerHeadlessTestClasses,
} from "../HeadlessBattleTestSupport";

const TEST_SKILL_ID = 970001;

/** Verifies that a delayed Skill action cannot survive its caster's pooled reuse. */
export class SkillReleaseRegressionCase implements HeadlessTestCase {
    readonly name = "delayed skill action cancels after caster release and pooled reuse";

    run(): void {
        registerHeadlessTestClasses();
        const action = createHeadlessCountingAction(0.2);
        const skillInfo = new SkillInfo({
            ID: TEST_SKILL_ID,
            SkillID: TEST_SKILL_ID,
            Level: 1,
            Name: "Headless delayed skill",
            MaxLevel: 1,
            SkillType: "Active",
            TargetType: "Target",
            CastRange: 0,
            CD: 0,
            CostType: "None",
            CostValue: 0,
            Action: "",
            Desc: "",
        }, [action]);
        const skillMgr = SkillMgr.instance;
        const originalGetSkillLevel = skillMgr.getSkillLevel;
        (skillMgr as any).getSkillLevel = (skillId: number, level: number) => (
            skillId === TEST_SKILL_ID && level === 1 ? skillInfo : null
        );

        const world = new HeadlessTestWorld();
        try {
            world.start();
            const caster = world.createEntity(1, 0, 0);
            const target = world.createEntity(2, 120, 0);
            const skillAgent = new SkillAgent();
            caster.addModule(skillAgent);

            assertHeadless(
                skillAgent.castSkill(caster, TEST_SKILL_ID, 1, world.curTime, target.uid, target.x, target.y),
                "failed to queue delayed skill action"
            );
            caster.release();
            const releasedCasterUid = caster.uid;
            world.stepFrames(1);
            assertHeadless(world.getLiveObject(releasedCasterUid) === null, "released caster stayed live");

            const replacement = world.createEntity(1, 600, 600);
            assertHeadless(replacement === caster, "test did not reuse the released caster instance");
            world.stepFrames(10);

            assertHeadless(action.executionCount === 0, "delayed skill action executed after caster pooled reuse");
            assertHeadless(!skillAgent.isExecuting(), "pooled caster retained delayed skill state");
        } finally {
            (skillMgr as any).getSkillLevel = originalGetSkillLevel;
            world.stop();
        }
    }
}
