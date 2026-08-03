import { ItemData } from "./ItemData";

export enum ItemType {
    Material = "Material",
    Consumable = "Consumable",
    Currency = "Currency",
    Equipment = "Equipment",
}

export class ItemInfo {
    constructor(readonly data: ItemData) {}

    get id(): number {
        return this.data.ID;
    }

    get maxStack(): number {
        return Math.max(1, Number(this.data.MaxStack) || 1);
    }

    get canUse(): boolean {
        return this.data.Type === ItemType.Consumable && this.data.UseAction.length > 0;
    }

    get iconPath(): string {
        return this.data.Icon || "";
    }
}
