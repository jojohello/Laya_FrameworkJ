import { SceneTime, SceneTimeMode } from "../../src/logic/scene/SceneTime";

const EPSILON = 1e-9;

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`[SceneTime.test] ${message}`);
    }
}

function assertNear(actual: number, expected: number, message: string): void {
    assert(
        Math.abs(actual - expected) <= EPSILON,
        `${message}: expected=${expected}, actual=${actual}`
    );
}

function drainLogicUpdates(sceneTime: SceneTime): number[] {
    const deltas: number[] = [];
    while (sceneTime.hasLogicUpdate()) {
        deltas.push(sceneTime.consumeLogicUpdate());
    }
    return deltas;
}

function verifyRealtime(): void {
    const sceneTime = new SceneTime();
    sceneTime.start();

    sceneTime.beginFrame(0.1, 0.4);
    const restoredFrame = drainLogicUpdates(sceneTime);
    assert(restoredFrame.length === 1, "Realtime must update once per Laya frame");
    assertNear(restoredFrame[0], 0.5, "Realtime must include full background elapsed time");
    assertNear(sceneTime.curTime, 0.5, "Realtime curTime");
    assertNear(sceneTime.consumeRenderDelta(), 0.5, "Realtime renderDt");

    sceneTime.setTimeScale(2);
    sceneTime.beginFrame(0.1);
    const acceleratedFrame = drainLogicUpdates(sceneTime);
    assert(acceleratedFrame.length === 1, "Realtime 2x update count");
    assertNear(acceleratedFrame[0], 0.2, "Realtime 2x logicDt");

    sceneTime.pause();
    sceneTime.beginFrame(1);
    assert(!sceneTime.hasLogicUpdate(), "Paused Realtime must not update logic");
    assertNear(sceneTime.consumeRenderDelta(), 0.2, "Paused render keeps prior unpresented delta");
    sceneTime.beginFrame(1);
    assertNear(sceneTime.consumeRenderDelta(), 0, "Paused Realtime must not create renderDt");
}

function verifyFixedTickCountsAndRenderSkip(): void {
    const sceneTime = new SceneTime();
    const step = 1 / SceneTime.DEFAULT_FIXED_TICK_RATE;
    sceneTime.setMode(SceneTimeMode.FixedTick);
    sceneTime.start();

    for (const updateCount of [1, 3]) {
        sceneTime.beginFrame(step * updateCount);
        assert(
            drainLogicUpdates(sceneTime).length === updateCount,
            `FixedTick single-frame update count ${updateCount}`
        );
        assert(sceneTime.shouldRenderUpdate(), `${updateCount} updates must allow render`);
        assertNear(
            sceneTime.consumeRenderDelta(),
            step * updateCount,
            `${updateCount} updates renderDt`
        );
    }

    sceneTime.beginFrame(step * 4);
    assert(drainLogicUpdates(sceneTime).length === 4, "FixedTick single-frame update count 4");
    assert(!sceneTime.shouldRenderUpdate(), "4 updates must skip render");

    sceneTime.beginFrame(step);
    assert(drainLogicUpdates(sceneTime).length === 1, "FixedTick recovery update count");
    assert(sceneTime.shouldRenderUpdate(), "Recovered frame must render");
    assertNear(sceneTime.consumeRenderDelta(), step * 5, "Skipped renderDt must accumulate");
}

function verifyFixedTickBacklogAndScale(): void {
    const sceneTime = new SceneTime();
    const step = 1 / SceneTime.DEFAULT_FIXED_TICK_RATE;
    sceneTime.setMode(SceneTimeMode.FixedTick);
    sceneTime.start();

    sceneTime.beginFrame(step * 7);
    assert(
        drainLogicUpdates(sceneTime).length === SceneTime.MAX_FIXED_UPDATES_PER_FRAME,
        "FixedTick must enforce the per-frame update cap"
    );
    assert(!sceneTime.shouldRenderUpdate(), "5 updates must skip render");

    sceneTime.beginFrame(0);
    assert(drainLogicUpdates(sceneTime).length === 2, "FixedTick backlog must not be dropped");
    assert(sceneTime.shouldRenderUpdate(), "Backlog recovery with 2 updates must render");
    assertNear(sceneTime.consumeRenderDelta(), step * 7, "Backlog renderDt must include all ticks");

    sceneTime.setTimeScale(2);
    sceneTime.beginFrame(step);
    assert(drainLogicUpdates(sceneTime).length === 2, "FixedTick 2x must accumulate two ticks");

    sceneTime.pause();
    sceneTime.beginFrame(step * 5);
    assert(!sceneTime.hasLogicUpdate(), "Paused FixedTick must not update logic");
}

function verifyFixedTickIgnoresBackgroundElapsed(): void {
    const sceneTime = new SceneTime();
    sceneTime.setMode(SceneTimeMode.FixedTick);
    sceneTime.start();
    sceneTime.beginFrame(0, 10);
    assert(!sceneTime.hasLogicUpdate(), "FixedTick must ignore background elapsed time");
    assertNear(sceneTime.curTime, 0, "FixedTick background curTime");
}

verifyRealtime();
verifyFixedTickCountsAndRenderSkip();
verifyFixedTickBacklogAndScale();
verifyFixedTickIgnoresBackgroundElapsed();
console.log("[SceneTime.test] PASS");
