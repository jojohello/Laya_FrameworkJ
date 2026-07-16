import { ConfigMgr } from "../config/ConfigMgr";
import { IManager } from "../core/IManager";
import { DialogMgr } from "../ui/dialog/DialogMgr";
import { GuideActionRunner } from "./GuideActionRunner";
import { GuideCommandRegistry } from "./GuideCommandRegistry";
import { GuideConditionRegistry } from "./GuideConditionRegistry";
import { GuideProtocol } from "./GuideProtocol";
import { GuideConfig, GuideFlow, GuideInitData, GuideProgress } from "./GuideTypes";

export class GuideMgr implements IManager {
    private static _instance: GuideMgr;
    static get instance(): GuideMgr {
        if (!this._instance) this._instance = new GuideMgr();
        return this._instance;
    }

    private readonly _conditions = new GuideConditionRegistry();
    private readonly _runner = new GuideActionRunner(this._conditions, GuideCommandRegistry.instance);
    private readonly _availableIds: number[] = [];
    private readonly _progress = new Map<number, GuideProgress>();
    private _protocol: GuideProtocol | null = null;
    private _running = false;
    private _ready = false;
    private _generation = 0;
    private _nextCheckAt = 0;
    private constructor() {}

    init(): void {
        this._protocol = new GuideProtocol();
        this._protocol.init();
    }

    update(_dt: number): void {
        if (!this._ready || this._running || Date.now() < this._nextCheckAt) return;
        this._nextCheckAt = Date.now() + 200;
        void this.tryStartNext();
    }

    reset(): void {
        this.cancelCurrent();
        this._availableIds.length = 0;
        this._progress.clear();
        this._ready = false;
    }

    release(): void {
        this.reset();
        this._protocol?.release();
        this._protocol = null;
        GuideCommandRegistry.instance.clear();
    }

    applyInit(data: GuideInitData): void {
        this.cancelCurrent();
        this._availableIds.length = 0;
        if (Array.isArray(data?.availableIds)) {
            for (const id of data.availableIds) {
                if (Number.isInteger(id) && id > 0) this._availableIds.push(id);
            }
        }
        this._progress.clear();
        if (Array.isArray(data?.progress)) {
            for (const progress of data.progress) {
                if (Number.isInteger(progress?.guideId)) this._progress.set(progress.guideId, progress);
            }
        }
        this._ready = true;
        this._nextCheckAt = 0;
    }

    get isRunning(): boolean {
        return this._running;
    }

    private async tryStartNext(): Promise<void> {
        const candidate = this.findCandidate();
        if (!candidate) return;
        this._running = true;
        const generation = this._generation;
        try {
            const flow = await this.loadFlow(candidate.flowId);
            if (!flow || flow.flowId !== candidate.flowId) throw new Error(`[Guide] Invalid flow ${candidate.flowId}`);
            const current = this._progress.get(candidate.ID);
            const currentStepId = current?.currentStepId || 0;
            if (!current && !this._conditions.evaluate(candidate.triggerType, candidate.triggerArgs)) return;
            if (!this._runner.canStart(flow, currentStepId)) return;
            if (!await this.report(candidate, "inProgress", currentStepId)) {
                throw new Error(`[Guide] Server rejected guide ${candidate.ID}`);
            }
            const lastStepId = await this._runner.execute(
                flow,
                currentStepId,
                stepId => this.report(candidate, "inProgress", stepId),
                () => generation !== this._generation
            );
            if (!await this.report(candidate, "completed", lastStepId)) {
                throw new Error(`[Guide] Server rejected completion ${candidate.ID}`);
            }
            const index = this._availableIds.indexOf(candidate.ID);
            if (index >= 0) this._availableIds.splice(index, 1);
        } catch (error) {
            if (generation === this._generation) console.error("[Guide] Flow execution failed:", error);
        } finally {
            if (generation === this._generation) this._running = false;
        }
    }

    private findCandidate(): GuideConfig | null {
        for (const id of this._availableIds) {
            const config = ConfigMgr.instance.getConfig<GuideConfig>("Guide", id);
            if (!config?.enabled) continue;
            const progress = this._progress.get(id);
            if (progress?.status === "completed") continue;
            if (progress || this._conditions.evaluate(config.triggerType, config.triggerArgs)) return config;
        }
        return null;
    }

    private async loadFlow(flowId: number): Promise<GuideFlow | null> {
        const path = `guides/${flowId}.json`;
        const loaded = await Laya.loader.load(path);
        const resource = Laya.loader.getRes(path) || loaded;
        return ((resource as any)?.data ?? resource) as GuideFlow | null;
    }

    private async report(config: GuideConfig, status: "inProgress" | "completed", stepId: number): Promise<boolean> {
        const success = await this._protocol!.reportProgress(config.ID, status, stepId, config.version);
        if (success) {
            this._progress.set(config.ID, {
                guideId: config.ID,
                status,
                currentStepId: stepId,
                scriptVersion: config.version,
            });
        }
        return success;
    }

    private cancelCurrent(): void {
        if (this._running && DialogMgr.instance.isOpened) DialogMgr.instance.close();
        this._generation++;
        this._running = false;
    }
}
