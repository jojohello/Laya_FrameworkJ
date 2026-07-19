export interface CharacterAnimationConfigInfo {
    ID: number;
    characterId: number;
    action: "idle" | "walk" | "attack";
    atlasPath: string;
    framePrefix: string;
    maskFramePrefix: string;
    frameCount: number;
    interval: number;
    loop: boolean;
    nextAction: string;
}
