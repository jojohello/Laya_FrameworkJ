/**
 * 主场景
 * 游戏主场景，驱动主界面 UI
 */
const { regClass } = Laya;
import { BaseScene } from "../scene/BaseScene";

@regClass()
export class MainScene extends BaseScene {
    private _groundFallback: Laya.Sprite | null = null;

    // ========== 场景生命周期 ==========

    onEnter(param?: any): void {
        super.onEnter(param);
        Laya.stage.off(Laya.Event.RESIZE, this, this.refreshGroundFallback);
        Laya.stage.on(Laya.Event.RESIZE, this, this.refreshGroundFallback);

        const belowScene = (Laya.Browser.window as any).LayerMgr?.layers?.BelowScene as Laya.Sprite | undefined;
        if (belowScene) {
            if (!this._groundFallback) {
                this._groundFallback = new Laya.Sprite();
                this._groundFallback.name = "MainSceneGroundFallback";
            }
            this.refreshGroundFallback();
            belowScene.addChildAt(this._groundFallback, 0);
        }
        
        // 场景特有的初始化逻辑
        // 如：加载玩家数据、初始化游戏状态等
    }

    onExit(): void {
        Laya.stage.off(Laya.Event.RESIZE, this, this.refreshGroundFallback);
        this._groundFallback?.removeSelf();
        super.onExit();
        
        // 场景特有的清理逻辑
    }

    private refreshGroundFallback(): void {
        if (!this._groundFallback) return;
        this._groundFallback.graphics.clear();
        this._groundFallback.graphics.drawRect(
            0, 0, Laya.stage.width, Laya.stage.height, "#d7e4df");
    }

    onDestroy(): void {
        super.onDestroy();
    }

    // ========== 更新逻辑 ==========

    protected logicUpdate(logicDt: number, curTime: number, tick: number): void {
        super.logicUpdate(logicDt, curTime, tick);
        // 主场景特有的每帧逻辑
        // 如：玩家移动、NPC 行为等
    }

    protected onFixedUpdate(curTime: number, tick: number): void {
        // 固定间隔更新（用于 AI、网络同步等）
    }
}

// 场景类 runtime lookup 注册：@regClass 绑定编辑器资源身份，
// 此处显式注册运行时按名查找的 key，供 SceneMgr.createScene 使用。
Laya.ClassUtils.regClass("MainScene", MainScene);
