import {
    resolveSceneCameraBackendPositions,
    SceneCameraDragTracker,
    SceneCameraMode,
    SceneCameraState,
} from "../../src/logic/scene/SceneCameraState";

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
    assert(Object.is(actual, expected), `${message}: expected=${String(expected)} actual=${String(actual)}`);
}

function run(): void {
    const state = new SceneCameraState();
    assertEqual(state.mode, SceneCameraMode.Fixed, "camera starts fixed");

    state.setBounds(0, 250, 0, 500);
    state.lookAt(400, 700, 300, 400);
    assertEqual(state.x, 250, "lookAt centers and clamps x");
    assertEqual(state.y, 500, "lookAt centers and clamps y");
    assertEqual(state.mode, SceneCameraMode.Fixed, "lookAt ends fixed");

    state.setTarget(42, 10, -20);
    assertEqual(state.mode, SceneCameraMode.Follow, "setTarget enters follow");
    assertEqual(state.targetUid, 42, "setTarget stores only uid");

    state.updateTarget(200, 300, 300, 400);
    assertEqual(state.x, 60, "target follow centers x with offset");
    assertEqual(state.y, 80, "target follow centers y with offset");

    state.enableDrag();
    assertEqual(state.mode, SceneCameraMode.Drag, "enableDrag enters drag");
    assertEqual(state.targetUid, 0, "drag clears target");

    state.setTarget(7);
    state.clearTarget();
    assertEqual(state.mode, SceneCameraMode.Fixed, "clearTarget returns fixed");
    assertEqual(state.targetUid, 0, "clearTarget clears uid");

    state.setTarget(0);
    assertEqual(state.mode, SceneCameraMode.Fixed, "invalid target remains fixed");

    const drag = new SceneCameraDragTracker(12);
    drag.begin(100, 100, 0, 318);
    assertEqual(
        drag.update(106, 106, false, true),
        null,
        "movement below threshold stays a click"
    );
    const verticalMove = drag.update(100, 130, false, true);
    assert(verticalMove !== null, "movement beyond threshold starts drag");
    assertEqual(verticalMove.x, 0, "vertical drag locks x");
    assertEqual(verticalMove.y, 288, "vertical drag uses full pointer delta");
    assertEqual(drag.end(), true, "end reports a completed drag");

    const rootBackend = resolveSceneCameraBackendPositions(18, 262, true);
    assertEqual(rootBackend.cameraX, 0, "root backend leaves native camera x neutral");
    assertEqual(rootBackend.cameraY, 0, "root backend leaves native camera y neutral");
    assertEqual(rootBackend.rootX, -18, "root backend translates root x");
    assertEqual(rootBackend.rootY, -262, "root backend translates root y");

    const nativeBackend = resolveSceneCameraBackendPositions(18, 262, false);
    assertEqual(nativeBackend.cameraX, 18, "native backend moves camera x");
    assertEqual(nativeBackend.cameraY, 262, "native backend moves camera y");
    assertEqual(nativeBackend.rootX, 0, "native backend leaves root x neutral");
    assertEqual(nativeBackend.rootY, 0, "native backend leaves root y neutral");

    console.log("[SceneCameraStateTest] PASS");
}

run();
