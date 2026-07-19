export interface FsmRuntime {
    currentStateName: string;
    stateData: Map<string, any>;
}

export interface FsmOwner {
    fsmRuntime?: FsmRuntime;
}

export abstract class BaseState<TOwner extends FsmOwner = any> {
    private _stateName: string = "";

    getStateName(): string {
        if (!this._stateName) {
            this._stateName = this.constructor.name.replace("State", "");
        }

        return this._stateName;
    }

    onEnter(_owner: TOwner, _runtime: FsmRuntime): void {
    }

    onUpdate(_owner: TOwner, _curTime: number, _runtime: FsmRuntime): void {
    }

    onExit(_owner: TOwner, _runtime: FsmRuntime): void {
    }

    protected getStateData<T extends object>(runtime: FsmRuntime, defaultValue: T): T {
        const stateName = this.getStateName();
        let data = runtime.stateData.get(stateName) as T | undefined;
        if (!data) {
            data = defaultValue;
            runtime.stateData.set(stateName, data);
        }

        return data;
    }
}

/**
 * Shared state machine definition. Current state and state data are stored on owner.fsmRuntime.
 */
export class StateMachine<TOwner extends FsmOwner = any> {
    private readonly _stateMap: Map<string, BaseState<TOwner>> = new Map();

    registerState(state: BaseState<TOwner>): this {
        this._stateMap.set(state.getStateName(), state);
        return this;
    }

    setState(stateName: string, owner: TOwner, force: boolean = false): void {
        const runtime = this.getRuntime(owner);
        if (!force && runtime.currentStateName === stateName) return;

        const currentState = this._stateMap.get(runtime.currentStateName);
        if (currentState) {
            currentState.onExit(owner, runtime);
        }

        runtime.currentStateName = stateName;
        const nextState = this._stateMap.get(stateName);
        if (nextState) {
            nextState.onEnter(owner, runtime);
        }
    }

    update(owner: TOwner, curTime: number): void {
        const runtime = this.getRuntime(owner);
        const currentState = this._stateMap.get(runtime.currentStateName);
        if (currentState) {
            currentState.onUpdate(owner, curTime, runtime);
        }
    }

    getCurStateName(owner: TOwner): string {
        return this.getRuntime(owner).currentStateName;
    }

    reset(owner: TOwner): void {
        owner.fsmRuntime = {
            currentStateName: "",
            stateData: new Map(),
        };
    }

    private getRuntime(owner: TOwner): FsmRuntime {
        if (!owner.fsmRuntime) {
            owner.fsmRuntime = {
                currentStateName: "",
                stateData: new Map(),
            };
        }

        return owner.fsmRuntime;
    }
}
