import { IManager } from "../core/IManager";
import { FunctionOpenProtocol } from "./FunctionOpenProtocol";
import { FunctionOpenState } from "./FunctionOpenState";

export type FunctionOpenStateListener = (state: FunctionOpenState) => void;

export class FunctionOpenMgr implements IManager {
    private static _instance: FunctionOpenMgr;

    static get instance(): FunctionOpenMgr {
        if (!this._instance) this._instance = new FunctionOpenMgr();
        return this._instance;
    }

    private readonly _states = new Map<number, FunctionOpenState>();
    private readonly _listeners = new Set<FunctionOpenStateListener>();
    private _protocol: FunctionOpenProtocol | null = null;
    private _snapshotVersion = 0;
    private _stale = true;

    private constructor() {}

    init(): void {
        this._protocol = new FunctionOpenProtocol();
        this._protocol.init();
    }

    update(_dt: number): void {}

    reset(): void {
        this._states.clear();
        this._stale = true;
    }

    release(): void {
        this._protocol?.release();
        this._protocol = null;
        this._states.clear();
        this._listeners.clear();
    }

    isOpen(id: number): boolean {
        return this._states.get(id)?.opened === true;
    }

    getState(id: number): FunctionOpenState | null {
        return this._states.get(id) ?? null;
    }

    requestFullState(): void {
        this.beginSnapshotRefresh();
        this._protocol?.requestFullState();
    }

    beginSnapshotRefresh(): void {
        this._stale = true;
    }

    refreshAll(states: readonly FunctionOpenState[], snapshotVersion?: number): void {
        this._states.clear();
        for (const state of states) {
            if (this.isValidState(state)) {
                this._states.set(state.id, { ...state, opened: state.opened === true });
            }
        }
        this._snapshotVersion = snapshotVersion ?? this._snapshotVersion;
        this._stale = false;
    }

    applyOpened(state: FunctionOpenState): void {
        if (!this.isValidState(state)) return;

        const current = this._states.get(state.id);
        if (current?.opened === true) return;

        const next = { ...state, opened: true };
        this._states.set(state.id, next);
        for (const listener of this._listeners) listener(next);
    }

    addListener(listener: FunctionOpenStateListener): void {
        this._listeners.add(listener);
    }

    removeListener(listener: FunctionOpenStateListener): void {
        this._listeners.delete(listener);
    }

    get snapshotVersion(): number { return this._snapshotVersion; }
    get stale(): boolean { return this._stale; }

    private isValidState(state: FunctionOpenState): boolean {
        return Number.isInteger(state?.id) && state.id > 0;
    }
}
