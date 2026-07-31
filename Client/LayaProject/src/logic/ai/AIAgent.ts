import { BBaseNode } from "../behaviorTree/BehaviorNodes";

export interface AIOwner {
    aiStopped: boolean;
    nextAIThinkTime: number;
}

/** SceneTime uses seconds; 0.1s keeps decisions responsive while movement remains per-frame. */
export const DEFAULT_AI_THINK_INTERVAL_SECONDS = 0.1;

/**
 * Shared AI definition. Scheduling state uses scalar fields on the owner so
 * pooled entities do not allocate a Runtime object for every lifecycle.
 */
export class AIAgent<TOwner extends AIOwner = any> {
    private readonly _aiTree: BBaseNode<TOwner>;
    private readonly _thinkInterval: number;

    constructor(aiTree: BBaseNode<TOwner>, thinkInterval: number = DEFAULT_AI_THINK_INTERVAL_SECONDS) {
        this._aiTree = aiTree;
        this._thinkInterval = Math.max(0, thinkInterval);
    }

    update(owner: TOwner, curTime: number): void {
        if (owner.aiStopped) return;
        if (owner.nextAIThinkTime - curTime > 1e-9) return;

        owner.nextAIThinkTime = curTime + this._thinkInterval;
        this._aiTree.execute(owner, curTime);
    }

    stop(owner: TOwner): void {
        owner.aiStopped = true;
    }

    resume(owner: TOwner): void {
        owner.aiStopped = false;
    }

    reset(owner: TOwner): void {
        owner.aiStopped = false;
        owner.nextAIThinkTime = 0;
    }
}
