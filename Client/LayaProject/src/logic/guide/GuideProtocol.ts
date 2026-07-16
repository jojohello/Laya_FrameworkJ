import { LogicProtocol } from "../common/LogicProtocol";
import { MessageIds } from "../common/MessageIds";

interface PendingProgress {
    guideId: number;
    resolve: (success: boolean) => void;
    timer: number;
}

export class GuideProtocol extends LogicProtocol {
    private _pending: PendingProgress | null = null;

    protected register(): void {
        this.registerMessage(MessageIds.GUIDE_PROGRESS_RESPONSE, this.onProgress.bind(this));
    }

    reportProgress(guideId: number, status: "inProgress" | "completed", stepId: number, version: number): Promise<boolean> {
        if (this._pending) {
            clearTimeout(this._pending.timer);
            this._pending.resolve(false);
        }
        return new Promise<boolean>((resolve) => {
            const timer = setTimeout(() => {
                if (this._pending?.guideId !== guideId) return;
                this._pending = null;
                resolve(false);
            }, 5000) as unknown as number;
            this._pending = { guideId, resolve, timer };
            this.sendMessage(MessageIds.GUIDE_PROGRESS_REQUEST, { guideId, status, stepId, version });
        });
    }

    release(): void {
        if (this._pending) {
            clearTimeout(this._pending.timer);
            this._pending.resolve(false);
            this._pending = null;
        }
        super.release();
    }

    private onProgress(data: any): void {
        const pending = this._pending;
        if (!pending || Number(data?.guideId) !== pending.guideId) return;
        clearTimeout(pending.timer);
        this._pending = null;
        pending.resolve(data?.success === true);
    }
}
