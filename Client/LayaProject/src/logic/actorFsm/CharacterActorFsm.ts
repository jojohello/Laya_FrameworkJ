import { BaseState, StateMachine } from "./ActorFsm";
import type { CharacterSceneObj } from "../sceneObj/CharacterSceneObj";

export const CharacterStateName = {
    Idle: "Idle",
    Run: "Run",
    Attack: "Attack",
} as const;

export type CharacterStateNameValue = typeof CharacterStateName[keyof typeof CharacterStateName];

class StateIdle extends BaseState<CharacterSceneObj> {
    getStateName(): string {
        return CharacterStateName.Idle;
    }

    onEnter(owner: CharacterSceneObj, curTime: number): void {
        owner.playAnim("idle", curTime, true);
    }
}

class StateRun extends BaseState<CharacterSceneObj> {
    getStateName(): string {
        return CharacterStateName.Run;
    }

    onEnter(owner: CharacterSceneObj, curTime: number): void {
        // The gameplay state is Run; the current art/config action is named walk.
        owner.playAnim("walk", curTime, true);
        owner.beginRunState(curTime);
    }

    onUpdate(owner: CharacterSceneObj, curTime: number): void {
        owner.updateRunState(curTime);
    }

    onExit(owner: CharacterSceneObj): void {
        owner.endRunState();
    }
}

class StateAttack extends BaseState<CharacterSceneObj> {
    getStateName(): string {
        return CharacterStateName.Attack;
    }
}

/** Shared character state definitions; runtime state remains on each CharacterSceneObj. */
export const CharacterActorFsm = new StateMachine<CharacterSceneObj>()
    .registerState(new StateIdle())
    .registerState(new StateRun())
    .registerState(new StateAttack());
