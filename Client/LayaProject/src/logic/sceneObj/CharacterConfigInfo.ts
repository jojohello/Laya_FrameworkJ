export type SoldierType = "warrior" | "mage" | "priest";

/** Static character definition exported from Config/csv/Character.csv. */
export interface CharacterConfigInfo {
    ID: number;
    name: string;
    soldierType: SoldierType;
    sceneObjConfigId: number;
    modelPath: string;
    teamMaskPath: string;
    modelScale: number;
    /** Semicolon-separated Skill.SkillID values; empty until formal skills are assigned. */
    skillIds: string;
    /** Reserved AI template reference; 0 means no template is assigned yet. */
    aiTemplateId: number;
    description: string;
}
