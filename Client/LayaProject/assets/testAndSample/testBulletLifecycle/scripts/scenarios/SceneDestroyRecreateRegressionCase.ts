import { assertHeadless, HeadlessTestCase } from "../HeadlessTestRunner";
import { HeadlessTestWorld, registerHeadlessTestClasses } from "../HeadlessBattleTestSupport";

/** Ensures scene destruction does not leak pooled entities or spatial IDs into a new scene. */
export class SceneDestroyRecreateRegressionCase implements HeadlessTestCase {
    readonly name = "scene destroy and recreate clears pooled lifecycle state";

    run(): void {
        registerHeadlessTestClasses();
        const firstWorld = new HeadlessTestWorld();
        const secondWorld = new HeadlessTestWorld();
        let firstWorldStarted = false;
        let secondWorldStarted = false;

        try {
            firstWorld.start();
            firstWorldStarted = true;
            const firstEntity = firstWorld.createEntity(2, 120, 120);
            const releasedUid = firstEntity.uid;
            assertHeadless(firstWorld.getObjInRangeByTeam(2, 120, 120, 1)?.has(releasedUid), "first scene did not index its entity");

            firstWorld.stop();
            firstWorldStarted = false;
            assertHeadless(firstWorld.getLiveObject(releasedUid) === null, "destroyed scene kept its entity live");
            assertHeadless(firstWorld.objectCount === 0, "destroyed scene kept object map entries");

            secondWorld.start();
            secondWorldStarted = true;
            const replacement = secondWorld.createEntity(2, 640, 640);
            assertHeadless(replacement === firstEntity, "test did not reuse the pooled entity across scene recreation");
            assertHeadless(replacement.uid !== releasedUid, "pooled entity kept its destroyed-scene UID");
            assertHeadless(secondWorld.getLiveObject(releasedUid) === null, "new scene resolved a destroyed-scene UID");
            assertHeadless(secondWorld.objectCount === 1, "new scene did not start with exactly one entity");
            assertHeadless(!secondWorld.getObjInRangeByTeam(2, 120, 120, 1)?.has(releasedUid), "new scene spatial index retained a destroyed-scene UID");
            assertHeadless(secondWorld.getObjInRangeByTeam(2, 640, 640, 1)?.has(replacement.uid), "new scene did not index its replacement entity");
        } finally {
            if (secondWorldStarted) secondWorld.stop();
            if (firstWorldStarted) firstWorld.stop();
        }
    }
}
