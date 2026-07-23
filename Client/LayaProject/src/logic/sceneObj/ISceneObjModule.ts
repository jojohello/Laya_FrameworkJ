import type { BaseSceneObj } from "./BaseSceneObj";

/**
 * Scene object module lifecycle.
 * Modules are cached with their owner SceneObject and must clean their own state.
 */
export interface ISceneObjModule {
    /** Called before the owner starts a new lifecycle. */
    reset(owner: BaseSceneObj, curTime: number): void;

    /** Called after the owner starts a new lifecycle. */
    onOwnerInit?(owner: BaseSceneObj): void;

    /** Called during the owner's authoritative logic update. */
    onOwnerLogicUpdate?(owner: BaseSceneObj, logicDt: number, curTime: number, tick: number): void;

    /** Called during the owner's late logic update. */
    onOwnerLateLogicUpdate?(owner: BaseSceneObj, curTime: number, tick: number): void;

    /** Called during the owner's project-level render update. */
    onOwnerRenderUpdate?(
        owner: BaseSceneObj,
        renderDt: number,
        curTime: number,
        tick: number,
        interpolationAlpha: number
    ): void;

    /** Called during the owner's fixed update loop. */
    onOwnerFixedUpdate?(owner: BaseSceneObj, curTime: number, tick: number): void;

    /** Called when the owner has applied a changed display position. */
    onOwnerConfirmPos?(owner: BaseSceneObj): void;

    /** Called when the owner leaves scene and enters object pool. */
    onRecycle(owner: BaseSceneObj, curTime: number): void;

    /** Called when the owner is permanently disposed. */
    onDispose(owner: BaseSceneObj, curTime: number): void;
}
