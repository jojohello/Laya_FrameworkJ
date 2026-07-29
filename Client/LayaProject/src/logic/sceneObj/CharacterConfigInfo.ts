export type SoldierType = "warrior" | "mage" | "priest";

/** Static character definition exported from Config/csv/Character.csv. */
export interface CharacterConfigInfo {
    ID: number;
    name: string;
    soldierType: SoldierType;
    sceneObjConfigId: number;
    modelScale: number;
    /** Combat effect center offset from the logical foot point; negative is upward. */
    centerOffsetY: number;
    /** Semicolon-separated Skill.SkillID values; empty until formal skills are assigned. */
    skillIds: string;
    description: string;
}
