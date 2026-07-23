import { SceneType } from "../scene/SceneType";

interface BattleViewOpenParam {
    scene?: {
        setPaused?(paused: boolean): void;
        setTimeScale?(value: number): void;
        isPaused?: boolean;
        timeScale?: number;
    };
    switchScene?: (sceneType: SceneType, param?: any) => Promise<any>;
}

export class BattleMainViewController {
    private readonly _speedButton: Laya.GButton;
    private readonly _speedLabel: Laya.GTextField;
    private readonly _pauseButton: Laya.GButton;
    private readonly _backButton: Laya.GButton;
    private readonly _pauseOverlay: Laya.GBox;
    private _param: BattleViewOpenParam | null = null;
    private _timeScale = 1;

    constructor(view: Laya.Scene) {
        const toolbar = view.getChildByName("toolbar") as Laya.GBox;
        this._speedButton = toolbar.getChildByName("speedButton") as Laya.GButton;
        this._speedLabel = this._speedButton.getChildByName("speedLabel") as Laya.GTextField;
        this._pauseButton = toolbar.getChildByName("pauseButton") as Laya.GButton;
        this._backButton = toolbar.getChildByName("backButton") as Laya.GButton;
        this._pauseOverlay = view.getChildByName("pauseOverlay") as Laya.GBox;

        this._pauseOverlay.graphics.drawRect(0, 0, 750, 1334, "rgba(10, 25, 34, 0.62)");
    }

    onOpened(param?: BattleViewOpenParam): void {
        this.unbindEvents();
        this._param = param || null;
        this.setTimeScale(1);
        this.setPaused(false);
        this._speedButton.on(Laya.Event.CLICK, this, this.toggleTimeScale);
        this._pauseButton.on(Laya.Event.CLICK, this, this.togglePause);
        this._backButton.on(Laya.Event.CLICK, this, this.backToStage);
    }

    onClosed(): void {
        this.unbindEvents();
        this.setPaused(false);
        this.setTimeScale(1);
        this._param = null;
    }

    private unbindEvents(): void {
        this._speedButton.off(Laya.Event.CLICK, this, this.toggleTimeScale);
        this._pauseButton.off(Laya.Event.CLICK, this, this.togglePause);
        this._backButton.off(Laya.Event.CLICK, this, this.backToStage);
    }

    private toggleTimeScale(): void {
        this.setTimeScale(this._timeScale === 1 ? 2 : 1);
    }

    private setTimeScale(value: number): void {
        this._timeScale = value === 2 ? 2 : 1;
        this._param?.scene?.setTimeScale?.(this._timeScale);
        this._speedLabel.text = `${this._timeScale}×`;
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
