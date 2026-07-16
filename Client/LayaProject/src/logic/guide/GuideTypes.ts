export interface GuideConfig {
    ID: number;
    triggerType: string;
    triggerArgs: string;
    flowId: number;
    priority: number;
    version: number;
    enabled: boolean;
}

export interface GuideProgress {
    guideId: number;
    status: "queued" | "inProgress" | "completed";
    currentStepId: number;
    scriptVersion: number;
}

export interface GuideInitData {
    /** Server-authoritative FIFO queue; only the first unfinished ID may start. */
    availableIds: number[];
    progress: GuideProgress[];
}

export interface GuideConditionSpec {
    type: string;
    params?: any;
}

export interface GuideActionSpec {
    type: string;
    params?: any;
}

export interface GuideStep {
    stepId: number;
    waitFor?: GuideConditionSpec[];
    actions: GuideActionSpec[];
}

export interface GuideFlow {
    schemaVersion: number;
    flowId: number;
    steps: GuideStep[];
}
