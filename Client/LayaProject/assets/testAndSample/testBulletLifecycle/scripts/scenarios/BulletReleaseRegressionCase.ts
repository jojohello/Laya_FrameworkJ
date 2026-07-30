import { assertHeadless, HeadlessTestCase } from "../HeadlessTestRunner";
import { HeadlessTestWorld, registerHeadlessTestClasses } from "../HeadlessBattleTestSupport";

export class BulletReleaseRegressionCase implements HeadlessTestCase {
    readonly name = "bullet cancels after target release and pooled reuse";

    run(): void {
        registerHeadlessTestClasses();
        const world = new HeadlessTestWorld();
        world.start();
        try {
            const caster = world.createEntity(1, 0, 0);
            const target = world.createEntity(2, 120, 0);
            const bullet = world.createBullet(caster.x, caster.y, caster.team);
            bullet.initTraceMovement(caster.uid, target.uid, 240, 1, target.team);

            world.stepFrames(1);
            target.release();
            const releasedTargetId = target.uid;
            world.stepFrames(1);
            assertHeadless(world.getLiveObject(releasedTargetId) === null, "released target stayed live");

            const replacement = world.createEntity(2, 600, 600);
            assertHeadless(replacement === target, "test did not reuse the released pooled entity instance");
            world.stepFrames(1);
            assertHeadless(replacement.hitCount === 0, "bullet hit a pooled replacement after target release");
            assertHeadless(world.getLiveObject(bullet.uid) === null, "tracking bullet was not released after target became non-live");
        } finally {
            world.stop();
        }
    }
}
