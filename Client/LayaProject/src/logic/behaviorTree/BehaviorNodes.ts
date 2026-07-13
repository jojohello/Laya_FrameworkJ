export abstract class BBaseNode<TOwner = any> {
    /**
     * Execute this behavior node.
     * Return true when the node succeeds for this tick, false otherwise.
     */
    abstract execute(owner: TOwner, curTime: number): boolean;
}

export abstract class BCompositeNode<TOwner = any> extends BBaseNode<TOwner> {
    protected readonly _childList: BBaseNode<TOwner>[] = [];

    addChild(child: BBaseNode<TOwner>): this {
        this._childList.push(child);
        return this;
    }

    clearChildren(): void {
        this._childList.length = 0;
    }

    get childCount(): number {
        return this._childList.length;
    }
}

export class BSelectorNode<TOwner = any> extends BCompositeNode<TOwner> {
    execute(owner: TOwner, curTime: number): boolean {
        for (const child of this._childList) {
            if (child.execute(owner, curTime)) {
                return true;
            }
        }

        return false;
    }
}

export class BSequenceNode<TOwner = any> extends BCompositeNode<TOwner> {
    execute(owner: TOwner, curTime: number): boolean {
        for (const child of this._childList) {
            if (!child.execute(owner, curTime)) {
                return false;
            }
        }

        return true;
    }
}

export class BParallelNode<TOwner = any> extends BCompositeNode<TOwner> {
    execute(owner: TOwner, curTime: number): boolean {
        for (const child of this._childList) {
            child.execute(owner, curTime);
        }

        return true;
    }
}

export class BConditionNode<TOwner = any> extends BBaseNode<TOwner> {
    private readonly _condition: (owner: TOwner, curTime: number) => boolean;

    constructor(condition: (owner: TOwner, curTime: number) => boolean) {
        super();
        this._condition = condition;
    }

    execute(owner: TOwner, curTime: number): boolean {
        return this._condition(owner, curTime);
    }
}

export class BActionNode<TOwner = any> extends BBaseNode<TOwner> {
    private readonly _action: (owner: TOwner, curTime: number) => boolean;

    constructor(action: (owner: TOwner, curTime: number) => boolean) {
        super();
        this._action = action;
    }

    execute(owner: TOwner, curTime: number): boolean {
        return this._action(owner, curTime);
    }
}
