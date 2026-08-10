import { SceneMgr } from "../../../../../src/logic/scene/SceneMgr";
import { SceneTime, SceneTimeMode } from "../../../../../src/logic/scene/SceneTime";
import { assertHeadless, HeadlessTestCase } from "../HeadlessTestRunner";
import { HeadlessTestWorld } from "../HeadlessBattleTestSupport";

class FixedTickHeadlessWorld extends HeadlessTestWorld {
    constructor() {
        super();
        this.setTimeMode(SceneTimeMode.FixedTick);
        this.setFixedTickRate(SceneTime.DEFAULT_FIXED_TICK_RATE);
    }
}

interface SceneMgrTestAccess {
    _curScene: unknown;
    _pendingBackgroundElapsed: number;
    _discardNextTimerDelta: boolean;
    _isInBackground: boolean;
}

/** Verifies SceneMgr's background gate and preservation of player-controlled pause state. */
export class SceneBackgroundPauseRegressionCase implements HeadlessTestCase {
    readonly name = "background freezes fixed-tick scene and preserves manual pause";

    run(): void {
        const world = new FixedTickHeadlessWorld();
        const sceneMgr = SceneMgr.instance;
        const access = sceneMgr as unknown as SceneMgrTestAccess;
        const previous = {
            curScene: access._curScene,
            pendingBackgroundElapsed: access._pendingBackgroundElapsed,
            discardNextTimerDelta: access._discardNextTimerDelta,
            isInBackground: access._isInBackground,
        };
        let started = false;

        try {
            world.start();
            started = true;
            access._curScene = { scene: world };

            access._isInBackground = true;
            sceneMgr.update(10);
            assertHeadless(world.tick === 0, "fixed-tick scene advanced while backgrounded");

            access._isInBackground = false;
            access._pendingBackgroundElapsed = 10;
            access._discardNextTimerDelta = true;
            sceneMgr.update(10);
            assertHeadless(world.tick === 0, "fixed-tick scene caught up background time on recovery");

            sceneMgr.update(1 / SceneTime.DEFAULT_FIXED_TICK_RATE);
            const resumedTick: number = world.tick;
            assertHeadless(resumedTick === 1, "fixed-tick scene did not resume from its original tick");

            world.setPaused(true);
            access._isInBackground = true;
            sceneMgr.update(10);
            access._isInBackground = false;
            access._pendingBackgroundElapsed = 10;
            access._discardNextTimerDelta = true;
            sceneMgr.update(10);
            sceneMgr.update(1 / SceneTime.DEFAULT_FIXED_TICK_RATE);

            assertHeadless(world.isPaused, "foreground recovery cleared the player's manual pause");
            assertHeadless(Number(world.tick) === 1, "manually paused scene advanced after foreground recovery");
        } finally {
            access._curScene = previous.curScene;
            access._pendingBackgroundElapsed = previous.pendingBackgroundElapsed;
            access._discardNextTimerDelta = previous.discardNextTimerDelta;
            access._isInBackground = previous.isInBackground;
            if (started) world.stop();
        }
    }
}
