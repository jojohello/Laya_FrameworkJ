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
    status: "inProgress" | "completed";
    currentStepId: number;
    scriptVersion: number;
}

export interface GuideInitData {
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
