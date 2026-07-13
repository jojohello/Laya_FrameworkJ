/**
 * Scene display layer types.
 * Keep rendering order centralized so scene objects do not add themselves to stage.
 */
export enum SceneLayerType {
    Background = 0,
    Ground = 10,
    Object = 20,
    Bullet = 30,
    Effect = 40,
    Hud = 50,
    Debug = 60,
}

export const SceneLayerNames: Record<SceneLayerType, "BelowScene" | "Scene" | "AboveScene"> = {
    [SceneLayerType.Background]: "BelowScene",
    [SceneLayerType.Ground]: "Scene",
    [SceneLayerType.Object]: "Scene",
    [SceneLayerType.Bullet]: "Scene",
    [SceneLayerType.Effect]: "Scene",
    [SceneLayerType.Hud]: "AboveScene",
    [SceneLayerType.Debug]: "AboveScene",
};
