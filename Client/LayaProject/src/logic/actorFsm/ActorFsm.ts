export interface FsmOwner {
    fsmStateName?: string;
}

export abstract class BaseState<TOwner extends FsmOwner = any> {
    private _stateName: string = "";

    getStateName(): string {
        if (!this._stateName) {
            this._stateName = this.constructor.name.replace("State", "");
        }

        return this._stateName;
    }

    onEnter(_owner: TOwner, _curTime: number): void {
    }

    onUpdate(_owner: TOwner, _curTime: number): void {
    }

    onExit(_owner: TOwner, _curTime: number): void {
    }
}

/**
 * Shared state machine definition. Only the current state name is stored on the owner.
 */
export class StateMachine<TOwner extends FsmOwner = any> {
    private readonly _stateMap: Map<string, BaseState<TOwner>> = new Map();

    registerState(state: BaseState<TOwner>): this {
        this._stateMap.set(state.getStateName(), state);
        return this;
    }

    setState(stateName: string, owner: TOwner, curTime: number, force: boolean = false): void {
        const currentStateName = owner.fsmStateName || "";
        if (!force && currentStateName === stateName) return;

        const currentState = this._stateMap.get(currentStateName);
        if (currentState) {
            currentState.onExit(owner, curTime);
        }

        owner.fsmStateName = stateName;
        const nextState = this._stateMap.get(stateName);
        if (nextState) {
            nextState.onEnter(owner, curTime);
        }
    }

    update(owner: TOwner, curTime: number): void {
        const currentState = this._stateMap.get(owner.fsmStateName || "");
        if (currentState) {
            currentState.onUpdate(owner, curTime);
        }
    }

    getCurStateName(owner: TOwner): string {
        return owner.fsmStateName || "";
    }

    reset(owner: TOwner): void {
        owner.fsmStateName = "";
    }
}
