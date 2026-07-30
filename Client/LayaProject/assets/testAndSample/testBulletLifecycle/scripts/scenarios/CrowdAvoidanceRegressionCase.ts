import { LocalCrowdAvoidanceSystem } from "../../../../../src/logic/battleScene/LocalCrowdAvoidanceSystem";
import { assertHeadless, HeadlessTestCase } from "../HeadlessTestRunner";
import { HeadlessTestWorld, registerHeadlessTestClasses } from "../HeadlessBattleTestSupport";

/** Verifies that a running unit steers around a live same-team blocker before overlap. */
export class CrowdAvoidanceRegressionCase implements HeadlessTestCase {
    readonly name = "local crowd avoidance steers around a forward blocker and forgets released UIDs";

    run(): void {
        registerHeadlessTestClasses();
        const world = new HeadlessTestWorld();
        const avoidance = new LocalCrowdAvoidanceSystem();
        world.start();
        try {
            const rear = world.createEntity(1, 100, 100);
            // Keep this within the detection range of both the cached 20px editor class
            // and the current 25px runtime default; this test must not depend on hot reload.
            const blocker = world.createEntity(1, 100, 140);

            const first = avoidance.resolveMove(world, rear, 0, 10);
            assertHeadless(Math.abs(first.dx) > 0.01, "forward blocker did not produce lateral steering");
            assertHeadless(first.dy > 0, "avoidance lost forward progress");

            const second = avoidance.resolveMove(world, rear, 0, 10);
            assertHeadless(first.dx * second.dx > 0, "avoidance side changed while blocker stayed stable");

            const releasedUid = blocker.uid;
            blocker.release();
            world.stepFrames(1);
            avoidance.forget(releasedUid);
            const withoutBlocker = avoidance.resolveMove(world, rear, 0, 10);
            assertHeadless(Math.abs(withoutBlocker.dx) <= 0.01, "released blocker kept steering the rear unit");

            const replacement = world.createEntity(1, 100, 140);
            const afterReuse = avoidance.resolveMove(world, rear, 0, 10);
            assertHeadless(replacement.uid !== releasedUid, "pooled replacement reused its released UID");
            assertHeadless(Math.abs(afterReuse.dx) > 0.01, "pooled replacement did not become a fresh blocker");
        } finally {
            world.stop();
        }

        this.assertBypassCanReachAttackRange();
        this.assertConfiguredRangeDrivesAvoidance();
    }

    /** A lateral detour must pass the blocker instead of orbiting outside melee range. */
    private assertBypassCanReachAttackRange(): void {
        registerHeadlessTestClasses();
        const world = new HeadlessTestWorld();
        const avoidance = new LocalCrowdAvoidanceSystem();
        const targetX = 100;
        const targetY = 0;
        const attackRange = 40;
        let maxLateralOffset = 0;
        world.start();
        try {
            const rear = world.createEntity(1, targetX, 120);
            world.createEntity(1, targetX, 60);

            for (let step = 0; step < 80; step++) {
                const dx = targetX - rear.x;
                const dy = targetY - rear.y;
                const distance = Math.hypot(dx, dy);
                if (distance <= attackRange) break;
                const move = avoidance.resolveMove(world, rear, dx / distance * 4, dy / distance * 4);
                rear.setPos(rear.x + move.dx, rear.y + move.dy);
                maxLateralOffset = Math.max(maxLateralOffset, Math.abs(rear.x - targetX));
                world.stepFrames(1);
            }

            assertHeadless(maxLateralOffset > 0.01, "forward blocker did not create a bypass path");
            assertHeadless(
                Math.hypot(targetX - rear.x, targetY - rear.y) <= attackRange,
                "bypass kept the rear unit outside attack range"
            );
        } finally {
            world.stop();
        }
    }

    /** Spatial occupancy range is also the authoritative crowd body size. */
    private assertConfiguredRangeDrivesAvoidance(): void {
        registerHeadlessTestClasses();
        const world = new HeadlessTestWorld();
        const avoidance = new LocalCrowdAvoidanceSystem();
        world.start();
        try {
            const rear = world.createEntity(1, 100, 100);
            const blocker = world.createEntity(1, 100, 180);
            rear.setCollisionBox(40);
            blocker.setCollisionBox(40);

            const move = avoidance.resolveMove(world, rear, 0, 10);
            assertHeadless(Math.abs(move.dx) > 0.01,
                "configured entity range did not expand crowd avoidance occupancy");
            assertHeadless(move.dy > 0, "range-driven avoidance lost forward progress");
        } finally {
            world.stop();
        }
    }
}
