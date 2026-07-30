import { SceneMoveVector } from "../../../../../src/logic/scene/SceneMoveVector";
import { BaseSceneObj } from "../../../../../src/logic/sceneObj/BaseSceneObj";
import { CharacterStateName } from "../../../../../src/logic/actorFsm/CharacterActorFsm";
import {
    getTargetCenterCastRange,
    getTargetCenterMoveStopRange,
    isTargetInCastRange,
    TARGET_RANGE_EPSILON,
} from "../../../../../src/logic/skill/SkillInfo";
import { assertHeadless, HeadlessTestCase } from "../HeadlessTestRunner";
import { HeadlessTestWorld, registerHeadlessTestClasses } from "../HeadlessBattleTestSupport";

class CrowdArrivalTestWorld extends HeadlessTestWorld {
    resolveCharacterMove(owner: BaseSceneObj, desiredDx: number, desiredDy: number, out: SceneMoveVector): SceneMoveVector {
        const length = Math.hypot(desiredDx, desiredDy);
        if (length <= 0) {
            out.dx = desiredDx;
            out.dy = desiredDy;
            return out;
        }

        // Deterministic stand-in for a live blocker: preserve movement length but keep
        // a lateral component. This isolates the Character Run stop-distance contract.
        const forwardX = desiredDx / length;
        const forwardY = desiredDy / length;
        out.dx = (forwardX - forwardY) * length * Math.SQRT1_2;
        out.dy = (forwardX + forwardY) * length * Math.SQRT1_2;
        return out;
    }
}

/** A lateral avoidance step must not asymptotically prevent the real Run state from reaching cast distance. */
export class CrowdAvoidanceArrivalRegressionCase implements HeadlessTestCase {
    readonly name = "crowd avoidance reaches the exact run stop distance instead of orbiting forever";

    run(): void {
        this.assertTargetEdgeRangeContract();
        registerHeadlessTestClasses();
        const world = new CrowdArrivalTestWorld();
        world.start();
        try {
            const rear = world.createCharacter(1, 100, 100);
            rear.runTo(100, 200, world.curTime, 40);

            world.stepFrames(60, 1 / 30);

            assertHeadless(rear.hasReachedRunTarget(), "rear character remained outside its run stop distance after avoidance");
            assertHeadless(rear.stateName === CharacterStateName.Idle, "rear character did not leave Run after reaching stop distance");
        } finally {
            world.stop();
        }
    }

    private assertTargetEdgeRangeContract(): void {
        const castRange = 40;
        const targetRange = 25;
        const centerRange = getTargetCenterCastRange(castRange, targetRange);
        const moveStopRange = getTargetCenterMoveStopRange(castRange, targetRange, 5);

        assertHeadless(centerRange === 65,
            "target edge cast range did not include the target body");
        assertHeadless(moveStopRange === 60,
            "AI movement did not stop five world units inside the cast boundary");
        assertHeadless(getTargetCenterMoveStopRange(2, 1, 5) === 0,
            "AI movement stop distance was not clamped at zero");
        assertHeadless(isTargetInCastRange(0, 0, 65, 0, castRange, targetRange),
            "target edge touching the cast range was rejected");
        assertHeadless(
            isTargetInCastRange(0, 0, 65 + TARGET_RANGE_EPSILON * 0.5, 0, castRange, targetRange),
            "numeric comparison tolerance did not accept a microscopic boundary overshoot"
        );
        assertHeadless(
            !isTargetInCastRange(0, 0, 65 + TARGET_RANGE_EPSILON * 2, 0, castRange, targetRange),
            "target beyond the target-edge cast range was accepted");
    }
}
