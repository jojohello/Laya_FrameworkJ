import { HeadlessTestRunner, HeadlessTestRunResult } from "../../testBulletLifecycle/scripts/HeadlessTestRunner";
import { BulletLiveTargetHitCase } from "../../testBulletLifecycle/scripts/scenarios/BulletLiveTargetHitCase";
import { BulletLineLifetimeRegressionCase } from "../../testBulletLifecycle/scripts/scenarios/BulletLineLifetimeRegressionCase";
import { BulletReleaseRegressionCase } from "../../testBulletLifecycle/scripts/scenarios/BulletReleaseRegressionCase";
import { SceneDestroyRecreateRegressionCase } from "../../testBulletLifecycle/scripts/scenarios/SceneDestroyRecreateRegressionCase";
import { SkillReleaseRegressionCase } from "../../testBulletLifecycle/scripts/scenarios/SkillReleaseRegressionCase";
import { BuffReleaseRegressionCase } from "../../testBulletLifecycle/scripts/scenarios/BuffReleaseRegressionCase";
import { AISchedulerLifecycleRegressionCase } from "../../testBulletLifecycle/scripts/scenarios/AISchedulerLifecycleRegressionCase";
import { CrowdAvoidanceRegressionCase } from "../../testBulletLifecycle/scripts/scenarios/CrowdAvoidanceRegressionCase";
import { CrowdAvoidanceArrivalRegressionCase } from "../../testBulletLifecycle/scripts/scenarios/CrowdAvoidanceArrivalRegressionCase";

export type BulletLifecycleTestId = "lineBulletHit" | "lineBulletLifetime" | "releasedTargetReuse" | "sceneDestroyRecreate" | "skillRelease" | "buffRelease" | "aiSchedulerLifecycle" | "crowdAvoidance" | "crowdAvoidanceArrival";

/** Runs real battle lifecycle tests in LayaAir IDE's Scene process only. */
@IEditorEnv.regClass()
export class BulletLifecycleEditorTestRunner {
    static async run(testId?: BulletLifecycleTestId): Promise<HeadlessTestRunResult> {
        const cases = testId === "lineBulletHit"
            ? [new BulletLiveTargetHitCase()]
            : testId === "lineBulletLifetime"
                ? [new BulletLineLifetimeRegressionCase()]
            : testId === "releasedTargetReuse"
                ? [new BulletReleaseRegressionCase()]
                : testId === "sceneDestroyRecreate"
                    ? [new SceneDestroyRecreateRegressionCase()]
                    : testId === "skillRelease"
                        ? [new SkillReleaseRegressionCase()]
                        : testId === "buffRelease"
                            ? [new BuffReleaseRegressionCase()]
                            : testId === "aiSchedulerLifecycle"
                                ? [new AISchedulerLifecycleRegressionCase()]
                                : testId === "crowdAvoidance"
                                    ? [new CrowdAvoidanceRegressionCase()]
                                    : testId === "crowdAvoidanceArrival"
                                        ? [new CrowdAvoidanceArrivalRegressionCase()]
                            : [
                                new BulletLiveTargetHitCase(),
                                new BulletLineLifetimeRegressionCase(),
                                new BulletReleaseRegressionCase(),
                                new SceneDestroyRecreateRegressionCase(),
                                new SkillReleaseRegressionCase(),
                                new BuffReleaseRegressionCase(),
                                new AISchedulerLifecycleRegressionCase(),
                                new CrowdAvoidanceRegressionCase(),
                                new CrowdAvoidanceArrivalRegressionCase(),
                            ];
        const result = await new HeadlessTestRunner(cases).run();

        if (!result.passed) {
            throw new Error(`[HeadlessTest] ${result.failedCount}/${result.totalCount} case(s) failed`);
        }
        return result;
    }
}
