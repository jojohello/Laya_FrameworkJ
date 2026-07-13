import type { BaseSceneObj } from "./BaseSceneObj";

/**
 * Scene object module lifecycle.
 * Modules are cached with their owner SceneObject and must clean their own state.
 */
export interface ISceneObjModule {
    /** Called when the module is added to an owner. */
    onAttach?(owner: BaseSceneObj): void;

    /** Called when the module is removed from an owner or the owner is disposed. */
    onDetach?(owner: BaseSceneObj): void;

    /** Called before the owner starts a new lifecycle. */
    reset(): void;

    /** Called after the owner starts a new lifecycle. */
    onOwnerInit?(owner: BaseSceneObj): void;

    /** Called during the owner's update loop. */
    onOwnerUpdate?(owner: BaseSceneObj, curTime: number): void;

    /** Called during the owner's late update loop. */
    onOwnerLateUpdate?(owner: BaseSceneObj, curTime: number): void;

    /** Called during the owner's fixed update loop. */
    onOwnerFixedUpdate?(owner: BaseSceneObj, curTime: number): void;

    /** Called when the owner has applied a changed display position. */
    onOwnerConfirmPos?(owner: BaseSceneObj): void;

    /** Called when the owner leaves scene and enters object pool. */
    onRecycle(): void;

    /** Called when the owner is permanently disposed. */
    onDispose(): void;
}
