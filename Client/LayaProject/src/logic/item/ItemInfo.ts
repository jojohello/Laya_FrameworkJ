import { ItemData, ItemCountData } from "./ItemData";

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
}

export class ItemCountInfo {
    constructor(readonly data: ItemCountData) {}

    get itemId(): number {
        return this.data.ItemID;
    }

    get count(): number {
        return Math.max(0, Number(this.data.Count) || 0);
    }

    setCount(value: number): void {
        this.data.Count = Math.max(0, Math.floor(Number(value) || 0));
    }

    addCount(delta: number): number {
        this.setCount(this.count + Math.floor(Number(delta) || 0));
        return this.count;
    }
}
