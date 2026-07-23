import { AIAgent, AIOwner } from "./AIAgent";

export interface AIScheduleItem<TOwner extends AIOwner = any> {
    id: number;
    agent: AIAgent<TOwner>;
    groupIndex: number;
}

export interface AIOwnerResolver<TOwner extends AIOwner = any> {
    getAIOwner(id: number): TOwner | null;
}

export interface AISchedulerOptions {
    groupCount?: number;
    maxItemsPerLogicUpdate?: number;
}

/**
 * Distributes AI thinking across authoritative logic updates.
 *
 * Example: groupCount=3 means only one group is ticked per logic update, so each
 * owner is considered every 3 ticks. AIAgent still owns the exact think interval.
 */
export class AIScheduler<TOwner extends AIOwner = any> {
    private readonly _groups: AIScheduleItem<TOwner>[][] = [];
    private readonly _itemMap: Map<number, AIScheduleItem<TOwner>> = new Map();
    private _groupCount: number = 3;
    private _maxItemsPerLogicUpdate: number = 0;
    private _nextRegisterIndex: number = 0;
    private _lastTick: number = 0;
    private _groupCursor: number = 0;
    private _pendingGroupIndex: number = -1;

    constructor(options?: AISchedulerOptions) {
        this.setGroupCount(options?.groupCount || 3);
        this._maxItemsPerLogicUpdate = Math.max(
            0,
            Math.floor(options?.maxItemsPerLogicUpdate || 0)
        );
    }

    register(id: number, agent: AIAgent<TOwner>): AIScheduleItem<TOwner> {
        const oldItem = this._itemMap.get(id);
        if (oldItem) {
            this.unregister(id);
        }

        const groupIndex = this._nextRegisterIndex % this._groupCount;
        this._nextRegisterIndex++;

        const item: AIScheduleItem<TOwner> = {
            id,
            agent,
            groupIndex,
        };

        this._groups[groupIndex].push(item);
        this._itemMap.set(id, item);
        return item;
    }

    unregister(id: number): boolean {
        const item = this._itemMap.get(id);
        if (!item) return false;

        const group = this._groups[item.groupIndex];
        const index = group.indexOf(item);
        if (index !== -1) {
            group.splice(index, 1);
            if (this._pendingGroupIndex === item.groupIndex && index < this._groupCursor) {
                this._groupCursor--;
            }
            if (group.length === 0 && this._pendingGroupIndex === item.groupIndex) {
                this._groupCursor = 0;
                this._pendingGroupIndex = -1;
            }
        }

        this._itemMap.delete(id);
        return true;
    }

    update(curTime: number, tick: number, resolver: AIOwnerResolver<TOwner>): void {
        if (this._groupCount <= 0 || this._itemMap.size === 0) return;

        this._lastTick = tick;
        const groupIndex = this._pendingGroupIndex >= 0
            ? this._pendingGroupIndex
            : Math.abs(Math.floor(tick)) % this._groupCount;

        const group = this._groups[groupIndex];
        if (group.length === 0) {
            this._groupCursor = 0;
            this._pendingGroupIndex = -1;
            return;
        }

        let processedCount = 0;
        let i = Math.min(this._groupCursor, group.length);
        while (i < group.length) {
            const item = group[i];
            const owner = resolver.getAIOwner(item.id);
            if (!owner) {
                group.splice(i, 1);
                this._itemMap.delete(item.id);
                continue;
            }

            item.agent.update(owner, curTime);
            processedCount++;
            i++;

            if (this._maxItemsPerLogicUpdate > 0
                && processedCount >= this._maxItemsPerLogicUpdate) {
                break;
            }
        }

        if (i < group.length) {
            this._groupCursor = i;
            this._pendingGroupIndex = groupIndex;
        } else {
            this._groupCursor = 0;
            this._pendingGroupIndex = -1;
        }
    }

    clear(): void {
        for (const group of this._groups) {
            group.length = 0;
        }
        this._itemMap.clear();
        this._nextRegisterIndex = 0;
        this._lastTick = 0;
        this._groupCursor = 0;
        this._pendingGroupIndex = -1;
    }

    setGroupCount(groupCount: number): void {
        const nextGroupCount = Math.max(1, Math.floor(groupCount));
        if (nextGroupCount === this._groupCount && this._groups.length > 0) return;

        const items = Array.from(this._itemMap.values());
        this._groupCount = nextGroupCount;
        this._groups.length = 0;
        for (let i = 0; i < this._groupCount; i++) {
            this._groups.push([]);
        }

        this._itemMap.clear();
        this._nextRegisterIndex = 0;
        this._groupCursor = 0;
        this._pendingGroupIndex = -1;
        for (const item of items) {
            this.register(item.id, item.agent);
        }
    }

    /**
     * Uses a deterministic item-count budget. Wall-clock execution time must
     * never decide which AI owners receive a gameplay update.
     */
    setLogicUpdateBudget(maxItemsPerLogicUpdate: number = 0): void {
        this._maxItemsPerLogicUpdate = Math.max(0, Math.floor(maxItemsPerLogicUpdate));
    }

    getGroupSize(groupIndex: number): number {
        const group = this._groups[groupIndex];
        return group ? group.length : 0;
    }

    get groupCount(): number {
        return this._groupCount;
    }

    get itemCount(): number {
        return this._itemMap.size;
    }

    get lastTick(): number {
        return this._lastTick;
    }

}
