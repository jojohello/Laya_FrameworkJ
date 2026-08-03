const { regClass } = Laya;

/** Editor-only, no-UI automatic test entry. */
@regClass()
export class HeadlessTestScene extends Laya.Script {
    async onEnable(): Promise<void> {
        // Avoid resolving LogicLib-dependent classes while the scene component is deserialized.
        const [{ HeadlessTestRunner }, { BulletLiveTargetHitCase }, { BulletReleaseRegressionCase }] = await Promise.all([
            import("./HeadlessTestRunner"),
            import("./scenarios/BulletLiveTargetHitCase"),
            import("./scenarios/BulletReleaseRegressionCase"),
        ]);
        const result = await new HeadlessTestRunner([
            new BulletLiveTargetHitCase(),
            new BulletReleaseRegressionCase(),
        ]).run();

        if (!result.passed) {
            throw new Error(`[HeadlessTest] ${result.failedCount}/${result.totalCount} case(s) failed`);
        }
    }
}
