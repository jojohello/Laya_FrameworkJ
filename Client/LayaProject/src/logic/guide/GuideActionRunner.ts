import { DialogMgr } from "../ui/dialog/DialogMgr";
import { GuideCommandRegistry } from "./GuideCommandRegistry";
import { GuideConditionRegistry } from "./GuideConditionRegistry";
import { GuideActionSpec, GuideFlow, GuideStep } from "./GuideTypes";

export class GuideActionRunner {
    constructor(
        private readonly _conditions: GuideConditionRegistry,
        private readonly _commands: GuideCommandRegistry
    ) {}

    canStart(flow: GuideFlow, currentStepId: number): boolean {
        const step = flow.steps.find(item => item.stepId > currentStepId);
        return !step || this._conditions.evaluateAll(step.waitFor);
    }

    async execute(
        flow: GuideFlow,
        currentStepId: number,
        onStepCompleted: (stepId: number) => Promise<boolean>,
        isCancelled: () => boolean
    ): Promise<number> {
        let completedStepId = currentStepId;
        const steps = [...flow.steps].sort((a, b) => a.stepId - b.stepId);
        for (const step of steps) {
            if (step.stepId <= currentStepId) continue;
            await this.waitForStep(step, isCancelled);
            for (const action of step.actions || []) {
                if (isCancelled()) throw new Error("Guide cancelled");
                await this.executeAction(action);
            }
            if (!await onStepCompleted(step.stepId)) {
                throw new Error(`[Guide] Server rejected step ${step.stepId}`);
            }
            completedStepId = step.stepId;
        }
        return completedStepId;
    }

    private async waitForStep(step: GuideStep, isCancelled: () => boolean): Promise<void> {
        const startedAt = Date.now();
        while (!this._conditions.evaluateAll(step.waitFor)) {
            if (isCancelled()) throw new Error("Guide cancelled");
            if (Date.now() - startedAt > 30000) {
                throw new Error(`[Guide] Wait condition timeout at step ${step.stepId}`);
            }
            await this.delay(100);
        }
    }

    private async executeAction(action: GuideActionSpec): Promise<void> {
        switch (action.type) {
            case "showConfirmDialog":
                await this.showConfirmDialog(action.params || {});
                return;
            case "invokeCommand":
                await this._commands.execute(String(action.params?.commandKey || ""), action.params?.args);
                return;
            case "delay":
                await this.delay(Math.max(0, Number(action.params?.milliseconds) || 0));
                return;
            default:
                throw new Error(`[Guide] Unknown action: ${action.type}`);
        }
    }

    private showConfirmDialog(params: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            DialogMgr.instance.show({
                title: String(params.title || "提示"),
                message: String(params.message || ""),
                confirmText: String(params.confirmText || "确定"),
                showClose: params.showClose !== false,
                onClosed: confirmed => confirmed ? resolve() : reject(new Error("Guide dialog cancelled")),
            }).catch(reject);
        });
    }

    private delay(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
}
