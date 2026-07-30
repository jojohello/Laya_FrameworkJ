import { BuffAgent } from "../../../../../src/logic/buff/BuffAgent";
import { SkillMgr } from "../../../../../src/logic/skill/SkillMgr";
import { BuffInfo } from "../../../../../src/logic/skill/SkillInfo";
import { assertHeadless, HeadlessTestCase } from "../HeadlessTestRunner";
import {
    createHeadlessCountingAction,
    HeadlessTestWorld,
    registerHeadlessTestClasses,
} from "../HeadlessBattleTestSupport";

const TEST_BUFF_ID = 970002;

/** Verifies that a pending Buff tick cannot affect a pooled replacement target. */
export class BuffReleaseRegressionCase implements HeadlessTestCase {
    readonly name = "buff tick cancels after target release and pooled reuse";

    run(): void {
        registerHeadlessTestClasses();
        const tickAction = createHeadlessCountingAction();
        const buffInfo = new BuffInfo({
            ID: TEST_BUFF_ID,
            Duration: 1000,
            TickInterval: 100,
            MaxStack: 1,
            StackType: "Refresh",
            AttrAdd: "",
            AttrPercent: "",
            OnAddAction: "",
            OnTickAction: "",
            OnRemoveAction: "",
            Desc: "",
        }, {
            onAddActions: [],
            onTickActions: [tickAction],
            onRemoveActions: [],
        });
        const skillMgr = SkillMgr.instance;
        const originalGetBuff = skillMgr.getBuff;
        (skillMgr as any).getBuff = (buffId: number) => buffId === TEST_BUFF_ID ? buffInfo : null;

        const world = new HeadlessTestWorld();
        try {
            world.start();
            const caster = world.createEntity(1, 0, 0);
            const target = world.createEntity(2, 120, 0);
            const buffAgent = new BuffAgent();
            target.addModule(buffAgent);

            assertHeadless(
                buffAgent.addBuff(target as any, TEST_BUFF_ID, caster.uid, 1, 0, world.curTime),
                "failed to add ticking buff"
            );
            target.release();
            const releasedTargetUid = target.uid;
            world.stepFrames(1);
            assertHeadless(world.getLiveObject(releasedTargetUid) === null, "released buff target stayed live");

            const replacement = world.createEntity(2, 600, 600);
            assertHeadless(replacement === target, "test did not reuse the released buff target instance");
            world.stepFrames(10);

            assertHeadless(tickAction.executionCount === 0, "buff tick executed on a pooled replacement target");
            assertHeadless(!buffAgent.hasBuff(TEST_BUFF_ID), "pooled target retained its old buff runtime");
        } finally {
            (skillMgr as any).getBuff = originalGetBuff;
            world.stop();
        }
    }
}
