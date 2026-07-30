export type SoldierType = "warrior" | "mage" | "priest";

export const DEFAULT_CHARACTER_RANGE = 25;
export const MAX_CHARACTER_RANGE = 256;

/** Static character definition exported from Config/csv/Character.csv. */
export interface CharacterConfigInfo {
    ID: number;
    name: string;
    soldierType: SoldierType;
    sceneObjConfigId: number;
    modelScale: number;
    /** Logical circular occupancy radius used by spatial queries, collision and local avoidance. */
    range: number;
    /** Combat effect center offset from the logical foot point; negative is upward. */
    centerOffsetY: number;
    /** Semicolon-separated Skill.SkillID values; empty until formal skills are assigned. */
    skillIds: string;
    description: string;
}
