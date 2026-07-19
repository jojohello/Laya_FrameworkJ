import { SceneType } from "../scene/SceneType";

interface BattleViewOpenParam {
    scene?: {
        setPaused?(paused: boolean): void;
        isPaused?: boolean;
    };
    switchScene?: (sceneType: SceneType, param?: any) => Promise<any>;
}

export class BattleMainViewController {
    private readonly _pauseButton: Laya.GLoader;
    private readonly _backButton: Laya.GLoader;
    private readonly _pauseOverlay: Laya.GBox;
    private _param: BattleViewOpenParam | null = null;

    constructor(view: Laya.Scene) {
        const toolbar = view.getChildByName("toolbar") as Laya.GBox;
        this._pauseButton = toolbar.getChildByName("pauseButton") as Laya.GLoader;
        this._backButton = toolbar.getChildByName("backButton") as Laya.GLoader;
        this._pauseOverlay = view.getChildByName("pauseOverlay") as Laya.GBox;

        this._pauseOverlay.graphics.drawRect(0, 0, 750, 1334, "rgba(10, 25, 34, 0.62)");
    }

    onOpened(param?: BattleViewOpenParam): void {
        this._param = param || null;
        this.setPaused(false);
        this._pauseButton.on(Laya.Event.CLICK, this, this.togglePause);
        this._backButton.on(Laya.Event.CLICK, this, this.backToStage);
    }

    onClosed(): void {
        this._pauseButton.off(Laya.Event.CLICK, this, this.togglePause);
        this._backButton.off(Laya.Event.CLICK, this, this.backToStage);
        this.setPaused(false);
        this._param = null;
    }

    private togglePause(): void {
        this.setPaused(!this._param?.scene?.isPaused);
    }

    private setPaused(paused: boolean): void {
        this._param?.scene?.setPaused?.(paused);
        this._pauseOverlay.visible = paused;
        this._pauseOverlay.mouseEnabled = paused;
        this._pauseButton.alpha = paused ? 0.82 : 1;
    }

    private backToStage(): void {
        this.setPaused(false);
        void this._param?.switchScene?.(SceneType.BattleStageScene);
    }
}
