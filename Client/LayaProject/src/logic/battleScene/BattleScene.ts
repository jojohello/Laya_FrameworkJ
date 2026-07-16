/** Battle scene entry skeleton. */
const { regClass } = Laya;
import { BaseScene } from "../scene/BaseScene";
import { SceneMgr } from "../scene/SceneMgr";
import { SceneType } from "../scene/SceneType";
import { ConfigMgr } from "../config/ConfigMgr";

@regClass()
export class BattleScene extends BaseScene {
    private _entryButton: Laya.Button | null = null;
    private _backButton: Laya.Button | null = null;
    private _stageConfig: any = null;

    onEnter(param?: any): void {
        super.onEnter(param);
        const stageId = Number(param?.stageId) || 1;
        this._stageConfig = ConfigMgr.instance.getConfig("BattleStage", stageId) || {
            stageName: "第一关",
            mapObjectName: "tower_1",
            enterText: "进入战斗",
            battleText: "战斗进行中"
        };
    }

    protected onUpdate(curTime: number, dt: number): void {
        super.onUpdate(curTime, dt);
        if (this.isReady) {
            this.createStageEntry();
            this.updateEntryPosition();
        }
    }

    onExit(): void {
        this._entryButton?.destroy();
        this._entryButton = null;
        this._backButton?.destroy();
        this._backButton = null;
        super.onExit();
    }

    onDestroy(): void {
        super.onDestroy();
    }

    private createStageEntry(): void {
        if (this._entryButton) return;

        const button = new Laya.Button();
        button.label = `${this._stageConfig?.stageName || "第一关"}\n${this._stageConfig?.enterText || "进入战斗"}`;
        button.labelSize = 24;
        button.labelColors = "#ffffff";
        button.skin = "ui/battle/btn_battle_start.png";
        button.size(190, 100);
        button.pos(0, 0);
        button.on(Laya.Event.CLICK, this, this.startBattle);
        Laya.stage.addChild(button);
        this._entryButton = button;

        const backButton = new Laya.Button();
        backButton.label = "\u8fd4\u56de\u4e3b\u57ce";
        backButton.labelSize = 22;
        backButton.labelColors = "#ffffff";
        backButton.skin = "ui/battle/btn_battle_start.png";
        backButton.size(160, 70);
        backButton.pos(24, 24);
        backButton.on(Laya.Event.CLICK, this, this.backToMainScene);
        Laya.stage.addChild(backButton);
        this._backButton = backButton;
    }

    private updateEntryPosition(): void {
        if (!this._entryButton) return;

        const stagePoint = this.map?.getLayerObject("object", this._stageConfig?.mapObjectName || "tower_1");
        const worldX = Number(stagePoint?.x);
        const worldY = Number(stagePoint?.y);
        const x = Number.isFinite(worldX) ? worldX : Laya.stage.width / 2;
        const y = Number.isFinite(worldY) ? worldY : Laya.stage.height / 2;
        const cameraX = this.camera?.x || 0;
        const cameraY = this.camera?.y || 0;
        this._entryButton.pos(x - cameraX - this._entryButton.width / 2, y - cameraY - this._entryButton.height / 2);
    }

    private startBattle(): void {
        if (this._entryButton) {
            this._entryButton.label = this._stageConfig?.battleText || "战斗进行中";
            this._entryButton.disabled = true;
        }
    }

    private backToMainScene(): void {
        void SceneMgr.instance.switchScene(SceneType.MainScene);
    }
}
