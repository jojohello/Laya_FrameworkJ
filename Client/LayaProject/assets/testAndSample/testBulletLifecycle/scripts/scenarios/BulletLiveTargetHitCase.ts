import { assertHeadless, HeadlessTestCase } from "../HeadlessTestRunner";
import { HeadlessTestWorld, registerHeadlessTestClasses } from "../HeadlessBattleTestSupport";

/** Verifies that normal line bullets still hit one live target exactly once. */
export class BulletLiveTargetHitCase implements HeadlessTestCase {
    readonly name = "line bullet hits one live target and is released";

    run(): void {
        registerHeadlessTestClasses();
        const world = new HeadlessTestWorld();
        world.start();
        try {
            const caster = world.createEntity(1, 0, 0);
            const target = world.createEntity(2, 120, 0);
            const bullet = world.createBullet(caster.x, caster.y, caster.team);
            const bulletId = bullet.uid;
            bullet.initLineMovement(caster.uid, target.x, target.y, 240, 1, target.team);

            world.stepFrames(20);

            assertHeadless(target.hitCount === 1, "line bullet did not hit the live target exactly once");
            assertHeadless(world.getLiveObject(bulletId) === null, "line bullet stayed live after its hit");
        } finally {
            world.stop();
        }
    }
}
