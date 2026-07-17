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

export const SceneLayerNames: Record<SceneLayerType, "Background" | "Ground" | "Object" | "Bullet" | "Effect" | "Hud" | "Debug"> = {
    [SceneLayerType.Background]: "Background",
    [SceneLayerType.Ground]: "Ground",
    [SceneLayerType.Object]: "Object",
    [SceneLayerType.Bullet]: "Bullet",
    [SceneLayerType.Effect]: "Effect",
    [SceneLayerType.Hud]: "Hud",
    [SceneLayerType.Debug]: "Debug",
};
