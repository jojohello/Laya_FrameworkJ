import { AIAgent, AIOwner } from "../../../../../src/logic/ai/AIAgent";
import { AIOwnerResolver, AIScheduler } from "../../../../../src/logic/ai/AIScheduler";
import { BActionNode } from "../../../../../src/logic/behaviorTree/BehaviorNodes";
import { assertHeadless, HeadlessTestCase } from "../HeadlessTestRunner";
import { HeadlessTestWorld, registerHeadlessTestClasses } from "../HeadlessBattleTestSupport";

interface HeadlessAIProbe extends AIOwner {
    readonly uid: number;
    thinkCount: number;
}

class HeadlessAIProbeResolver implements AIOwnerResolver<HeadlessAIProbe> {
    constructor(
        private readonly _world: HeadlessTestWorld,
        private readonly _probes: ReadonlyMap<number, HeadlessAIProbe>
    ) {
    }

    getAIOwner(uid: number): HeadlessAIProbe | null {
        return this._world.getLiveObject(uid) ? this._probes.get(uid) || null : null;
    }
}

function createProbe(uid: number): HeadlessAIProbe {
    return {
        uid,
        thinkCount: 0,
        aiStopped: false,
        nextAIThinkTime: 0,
    };
}

function getThinkCount(probe: HeadlessAIProbe): number {
    return probe.thinkCount;
}

function getScheduledItemCount(scheduler: AIScheduler<HeadlessAIProbe>): number {
    return scheduler.itemCount;
}

/** Verifies staggered thinking and that a released pooled UID cannot retain AI work. */
export class AISchedulerLifecycleRegressionCase implements HeadlessTestCase {
    readonly name = "AI scheduler rotates groups and drops released pooled UIDs";

    run(): void {
        registerHeadlessTestClasses();
        const world = new HeadlessTestWorld();
        const scheduler = new AIScheduler<HeadlessAIProbe>({ groupCount: 3 });
        const probes = new Map<number, HeadlessAIProbe>();
        const resolver = new HeadlessAIProbeResolver(world, probes);
        const agent = new AIAgent<HeadlessAIProbe>(new BActionNode(owner => {
            owner.thinkCount++;
            return true;
        }), 0);

        world.start();
        try {
            const first = world.createEntity(1, 100, 100);
            const released = world.createEntity(1, 200, 100);
            const third = world.createEntity(1, 300, 100);
            const firstProbe = createProbe(first.uid);
            const releasedProbe = createProbe(released.uid);
            const thirdProbe = createProbe(third.uid);
            agent.stop(firstProbe);
            agent.reset(firstProbe);
            assertHeadless(!firstProbe.aiStopped && firstProbe.nextAIThinkTime === 0,
                "AI reset did not clear the pooled owner's scalar scheduling state");
            probes.set(first.uid, firstProbe);
            probes.set(released.uid, releasedProbe);
            probes.set(third.uid, thirdProbe);
            scheduler.register(first.uid, agent);
            scheduler.register(released.uid, agent);
            scheduler.register(third.uid, agent);

            assertHeadless(scheduler.getGroupSize(0) === 1 && scheduler.getGroupSize(1) === 1 && scheduler.getGroupSize(2) === 1,
                "AI scheduler did not distribute three owners across its three groups");
            scheduler.update(0, 0, resolver);
            scheduler.update(1 / 30, 1, resolver);
            scheduler.update(2 / 30, 2, resolver);
            assertHeadless(getThinkCount(firstProbe) === 1 && getThinkCount(releasedProbe) === 1 && getThinkCount(thirdProbe) === 1,
                "AI scheduler did not update exactly one group per tick");

            const releasedUid = released.uid;
            released.release();
            world.stepFrames(1);
            assertHeadless(world.getLiveObject(releasedUid) === null, "released AI owner stayed live");
            scheduler.update(4 / 30, 4, resolver);
            assertHeadless(getScheduledItemCount(scheduler) === 2 && scheduler.getGroupSize(1) === 0,
                "AI scheduler kept a released owner UID after resolving it as non-live");
            assertHeadless(getThinkCount(releasedProbe) === 1, "released AI owner executed after release");

            const replacement = world.createEntity(1, 600, 600);
            assertHeadless(replacement === released, "test did not reuse the released AI owner instance");
            assertHeadless(replacement.uid !== releasedUid, "pooled AI owner kept its released UID");
            const replacementProbe = createProbe(replacement.uid);
            probes.set(replacement.uid, replacementProbe);
            scheduler.update(7 / 30, 7, resolver);
            assertHeadless(getThinkCount(replacementProbe) === 0,
                "pooled replacement inherited the released owner's scheduler entry");

            scheduler.register(replacement.uid, agent);
            scheduler.update(9 / 30, 9, resolver);
            assertHeadless(getThinkCount(replacementProbe) === 1, "newly registered pooled replacement was not scheduled");
            assertHeadless(scheduler.unregister(replacement.uid), "AI scheduler could not unregister a live owner");
            scheduler.update(12 / 30, 12, resolver);
            assertHeadless(getThinkCount(replacementProbe) === 1, "unregistered AI owner still executed");

            scheduler.clear();
            assertHeadless(getScheduledItemCount(scheduler) === 0, "AI scheduler clear kept scene lifecycle entries");
        } finally {
            scheduler.clear();
            world.stop();
        }
    }
}
