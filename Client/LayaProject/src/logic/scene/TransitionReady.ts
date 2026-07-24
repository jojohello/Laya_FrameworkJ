/**
 * Shared readiness contract for scene-transition participants.
 * SceneMgr keeps Loading visible until every participant is ready.
 */
export interface TransitionReady {
    readonly isTransitionReady: boolean;
    readonly transitionError: string;
}
