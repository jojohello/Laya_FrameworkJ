export enum ActionType {
    Animation = "Animation",
    Bullet = "Bullet",
    Buff = "Buff",
    Heal = "Heal",
    Damage = "Damage",
    TrueDamage = "TrueDamage",
    Effect = "Effect",
}

export class ActionInfo {
    constructor(
        readonly delaySeconds: number,
        readonly actionType: string,
        readonly params: string[],
        readonly raw: string,
        readonly index: number
    ) {}

    get id(): number {
        return this.index;
    }

    getNumberParam(index: number, defaultValue: number = 0): number {
        const value = Number(this.params[index]);
        return isFinite(value) ? value : defaultValue;
    }

    getStringParam(index: number, defaultValue: string = ""): string {
        const value = this.params[index];
        return value !== undefined ? value : defaultValue;
    }
}
