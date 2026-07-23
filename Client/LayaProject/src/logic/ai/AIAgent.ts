import { BBaseNode } from "../behaviorTree/BehaviorNodes";

export interface AIRuntime {
    stopped: boolean;
    nextThinkTime: number;
}

export interface AIOwner {
    aiRuntime?: AIRuntime;
}

/** SceneTime uses seconds; 0.1s keeps decisions responsive while movement remains per-frame. */
export const DEFAULT_AI_THINK_INTERVAL_SECONDS = 0.1;

/**
 * Shared AI definition. Per-entity runtime lives on owner.aiRuntime.
 */
export class AIAgent<TOwner extends AIOwner = any> {
    private readonly _aiTree: BBaseNode<TOwner>;
    private readonly _thinkInterval: number;

    constructor(aiTree: BBaseNode<TOwner>, thinkInterval: number = DEFAULT_AI_THINK_INTERVAL_SECONDS) {
        this._aiTree = aiTree;
        this._thinkInterval = Math.max(0, thinkInterval);
    }

    update(owner: TOwner, curTime: number): void {
        const runtime = this.getRuntime(owner);
        if (runtime.stopped) return;
        if (runtime.nextThinkTime - curTime > 1e-9) return;

        runtime.nextThinkTime = curTime + this._thinkInterval;
        this._aiTree.execute(owner, curTime);
    }

    stop(owner: TOwner): void {
        this.getRuntime(owner).stopped = true;
    }

    resume(owner: TOwner): void {
        this.getRuntime(owner).stopped = false;
    }

    reset(owner: TOwner): void {
        owner.aiRuntime = {
            stopped: false,
            nextThinkTime: 0,
        };
    }

    private getRuntime(owner: TOwner): AIRuntime {
        if (!owner.aiRuntime) {
            owner.aiRuntime = {
                stopped: false,
                nextThinkTime: 0,
            };
        }

        return owner.aiRuntime;
    }
}
