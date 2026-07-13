import { AIAgent, AIOwner } from "./AIAgent";

export interface AIScheduleItem<TOwner extends AIOwner = any> {
    id: number | string;
    owner: TOwner;
    agent: AIAgent<TOwner>;
    groupIndex: number;
}

export interface AISchedulerOptions {
    groupCount?: number;
    maxItemsPerFrame?: number;
    maxFrameTimeMs?: number;
}

/**
 * Distributes AI thinking across multiple frames.
 *
 * Example: groupCount=3 means only one group is ticked per frame, so each owner
 * is considered every 3 frames. AIAgent still owns the exact think interval.
 */
export class AIScheduler<TOwner extends AIOwner = any> {
    private readonly _groups: AIScheduleItem<TOwner>[][] = [];
    private readonly _itemMap: Map<number | string, AIScheduleItem<TOwner>> = new Map();
    private _groupCount: number = 3;
    private _maxItemsPerFrame: number = 0;
    private _maxFrameTimeMs: number = 0;
    private _nextRegisterIndex: number = 0;
    private _frameIndex: number = 0;
    private _groupCursor: number = 0;

    constructor(options?: AISchedulerOptions) {
        this.setGroupCount(options?.groupCount || 3);
        this._maxItemsPerFrame = Math.max(0, Math.floor(options?.maxItemsPerFrame || 0));
        this._maxFrameTimeMs = Math.max(0, options?.maxFrameTimeMs || 0);
    }

    register(id: number | string, owner: TOwner, agent: AIAgent<TOwner>): AIScheduleItem<TOwner> {
        const oldItem = this._itemMap.get(id);
        if (oldItem) {
            this.unregister(id);
        }

        const groupIndex = this._nextRegisterIndex % this._groupCount;
        this._nextRegisterIndex++;

        const item: AIScheduleItem<TOwner> = {
            id,
            owner,
            agent,
            groupIndex,
        };

        this._groups[groupIndex].push(item);
        this._itemMap.set(id, item);
        return item;
    }

    unregister(id: number | string): boolean {
        const item = this._itemMap.get(id);
        if (!item) return false;

        const group = this._groups[item.groupIndex];
        const index = group.indexOf(item);
        if (index !== -1) {
            group.splice(index, 1);
        }

        this._itemMap.delete(id);
        return true;
    }

    update(curTime: number): void {
        if (this._groupCount <= 0 || this._itemMap.size === 0) return;

        const groupIndex = this._frameIndex % this._groupCount;
        this._frameIndex++;

        const group = this._groups[groupIndex];
        if (group.length === 0) {
            this._groupCursor = 0;
            return;
        }

        const startTime = this.now();
        let processedCount = 0;
        let i = Math.min(this._groupCursor, group.length - 1);
        for (; i < group.length; i++) {
            const item = group[i];
            item.agent.update(item.owner, curTime);
            processedCount++;

            if (this._maxItemsPerFrame > 0 && processedCount >= this._maxItemsPerFrame) {
                break;
            }

            if (this._maxFrameTimeMs > 0 && this.now() - startTime >= this._maxFrameTimeMs) {
                break;
            }
        }

        if (i < group.length - 1) {
            this._groupCursor = i + 1;
            this._frameIndex--;
        } else {
            this._groupCursor = 0;
        }
    }

    clear(): void {
        for (const group of this._groups) {
            group.length = 0;
        }
        this._itemMap.clear();
        this._nextRegisterIndex = 0;
        this._frameIndex = 0;
        this._groupCursor = 0;
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
        for (const item of items) {
            this.register(item.id, item.owner, item.agent);
        }
    }

    setFrameBudget(maxItemsPerFrame: number = 0, maxFrameTimeMs: number = 0): void {
        this._maxItemsPerFrame = Math.max(0, Math.floor(maxItemsPerFrame));
        this._maxFrameTimeMs = Math.max(0, maxFrameTimeMs);
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

    get frameIndex(): number {
        return this._frameIndex;
    }

    private now(): number {
        if (typeof performance !== "undefined" && performance.now) {
            return performance.now();
        }

        return Date.now();
    }
}
