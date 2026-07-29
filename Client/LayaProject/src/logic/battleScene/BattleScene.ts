/** First real battle scene. */
const { regClass } = Laya;
import { BaseScene } from "../scene/BaseScene";
import { ConfigMgr } from "../config/ConfigMgr";
import { CharacterAnimationConfigInfo } from "../sceneObj/CharacterAnimationConfigInfo";
import { CharacterSceneObj } from "../sceneObj/CharacterSceneObj";
import { CharacterTeamColorMaterial } from "../sceneObj/CharacterTeamColorMaterial";
import { SceneTime, SceneTimeMode } from "../scene/SceneTime";
import { AIScheduler, AIOwnerResolver } from "../ai/AIScheduler";
import { SimpleCombatAIAgent } from "../ai/SimpleCombatAI";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { BattleFlowState } from "./BattleFlowState";
import { UIManager } from "../ui/UIManager";
import { BattleCompleteResult, BattleSettlementMgr } from "./BattleSettlementMgr";
import { ItemMgr } from "../item/ItemMgr";
import { ItemViewData } from "../ui/ItemViewController";
import { CombatFeedbackMgr } from "../combatFeedback/CombatFeedbackMgr";
import { EffectSceneObj } from "../sceneObj/EffectSceneObj";

type BattleResultUIName = "BattleVictoryUI" | "BattleDefeatUI";

interface BattleTestFormationRow {
    configId: number;
    count: number;
    startY: number;
    rowStepY: number;
}

const BATTLE_TEST_COLUMNS = 10;
const BATTLE_TEST_START_X = 150;
const BATTLE_TEST_COLUMN_STEP = 125;

/** 第一关实际战斗场景，加载配置指定的 TiledMap。 */
@regClass()
export class BattleScene extends BaseScene implements AIOwnerResolver<CharacterSceneObj> {
    private _battleUnitsCreated = false;
    private _battleUnitsReady = false;
    private _battleUnitLoadToken = 0;
    private _transitionError = "";
    private _flowState = BattleFlowState.Preparing;
    private _resultUIName: BattleResultUIName | null = null;
    private _resultExitRequested = false;
    private _battleSessionId = "";
    private readonly _aiScheduler = new AIScheduler<CharacterSceneObj>({
        groupCount: 3,
    });

    constructor() {
        super();
        this.setTimeMode(SceneTimeMode.FixedTick);
        this.setFixedTickRate(SceneTime.DEFAULT_FIXED_TICK_RATE);
    }

    onEnter(param?: any): void {
        this._aiScheduler.clear();
        this._battleUnitsCreated = false;
        this._battleUnitsReady = false;
        this._transitionError = "";
        this.transitionFlowState(BattleFlowState.Loading);
        this._resultUIName = null;
        this._resultExitRequested = false;
        this._battleSessionId = typeof param?.battleSessionId === "string" ? param.battleSessionId : "";
        this._battleUnitLoadToken++;
        this.applyStageMapConfig(param);
        super.onEnter(param);
    }

    /**
     * 战斗地图按关卡配置：从 BattleStage 表读取 stageId 对应的地图字段，
     * 覆盖 SceneType 中 BattleScene 的空地图配置，供 BaseScene.loadSceneMap 使用。
     */
    private applyStageMapConfig(param?: any): void {
        const stageId = param?.stageId;
        if (stageId === undefined || stageId === null) return;
        const stage = ConfigMgr.instance.getConfig<any>("BattleStage", stageId);
        if (!stage) {
            console.warn(`[BattleScene] BattleStage config not found: stageId=${stageId}`);
            return;
        }
        const config: any = this._sceneConfig || (this._sceneConfig = {});
        if (stage.map) config.map = stage.map;
        if (stage.mapType) config.mapType = stage.mapType;
        if (stage.mapWidth) config.mapWidth = stage.mapWidth;
        if (stage.mapHeight) config.mapHeight = stage.mapHeight;
        if (stage.tileWidth) config.tileWidth = stage.tileWidth;
        if (stage.tileHeight) config.tileHeight = stage.tileHeight;
        if (stage.enableLinear !== undefined) config.enableLinear = stage.enableLinear;
        if (stage.limitRange !== undefined) config.limitRange = stage.limitRange;
    }

    protected logicUpdate(logicDt: number, curTime: number, tick: number): void {
        if (this._flowState === BattleFlowState.Victory ||
            this._flowState === BattleFlowState.Defeat ||
            this._flowState === BattleFlowState.Exiting) {
            return;
        }
        this._aiScheduler.update(curTime, tick, this);
        super.logicUpdate(logicDt, curTime, tick);
        CombatFeedbackMgr.instance.update(this, curTime);
        if (this.isReady && !this._battleUnitsCreated) {
            this._battleUnitsCreated = true;
            void this.createBattleUnits();
        }
        this.evaluateBattleResult();
        // Hud layer does not carry runtime nodes; battle controls belong to the formal UI layer.
        return;
        /*
        if (!this._backButton && this.getSafeLayer(SceneLayerType.Hud)) {
            const hudLayer = this.getSafeLayer(SceneLayerType.Hud)!;
            this._backButton = new Laya.GLoader();
            this._backButton.name = "BattleBackToStageButton";
            this._backButton.url = `${BATTLE_UI_PATH}btn_battle_start.png`;
            this._backButton.size(170, 68);
            this._backButton.pos(18, 24);
            this._backButton.mouseEnabled = true;
            this._backButton.on(Laya.Event.CLICK, this, this.backToStage);
            hudLayer.addChild(this._backButton);

            this._backLabel = new Laya.GTextField();
            this._backLabel.text = "返回征战";
            this._backLabel.fontSize = 20;
            this._backLabel.bold = true;
            this._backLabel.color = "#ffffff";
            this._backLabel.stroke = 2;
            this._backLabel.strokeColor = "#513116";
            this._backLabel.align = "center";
            this._backLabel.valign = "middle";
            this._backLabel.size(170, 68);
            this._backButton.addChild(this._backLabel);
        }
        */
    }

    onExit(): void {
        this.transitionFlowState(BattleFlowState.Exiting);
        CombatFeedbackMgr.instance.clear(this);
        if (this._resultUIName) UIManager.instance.close(this._resultUIName);
        this._resultUIName = null;
        this._resultExitRequested = false;
        this._battleSessionId = "";
        this._battleUnitLoadToken++;
        this._battleUnitsCreated = false;
        this._battleUnitsReady = false;
        this._transitionError = "";
        super.onExit();
        this._aiScheduler.clear();
    }

    get flowState(): BattleFlowState {
        return this._flowState;
    }

    get isTransitionReady(): boolean {
        return super.isTransitionReady && this._battleUnitsReady;
    }

    get transitionError(): string {
        return this._transitionError;
    }

    /**
     * Allows an authoritative battle result to enter the same one-shot result
     * flow as local team elimination.
     */
    reportBattleResult(result: "victory" | "defeat"): boolean {
        if (this._flowState !== BattleFlowState.Running) return false;
        this.finishBattle(result);
        return true;
    }

    getAIOwner(id: number): CharacterSceneObj | null {
        const obj = this.getLiveObject(id);
        return obj instanceof CharacterSceneObj ? obj : null;
    }

    protected onObjectAdded(obj: BaseSceneObj): void {
        if (obj instanceof CharacterSceneObj) {
            this._aiScheduler.register(obj.uid, SimpleCombatAIAgent);
        }
    }

    protected onObjectRemoving(obj: BaseSceneObj): void {
        this._aiScheduler.unregister(obj.uid);
    }

    private async createBattleUnits(): Promise<void> {
        const token = this._battleUnitLoadToken;
        // 100 单位战斗表现测试阵容：双方各 25 战士、25 牧师，不使用法师。
        const playerConfigIds = [1001, 1003];
        const opponentConfigIds = [1001, 1003];
        const preloadConfigIds = [...new Set([...playerConfigIds, ...opponentConfigIds])];
        const paths = [...new Set([
            ...preloadConfigIds.flatMap(cfgId =>
                ConfigMgr.instance
                    .getByField<CharacterAnimationConfigInfo>("CharacterAnimation", "characterId", cfgId)
                    .map(config => config.atlasPath)
            ),
            ...EffectSceneObj.getPreloadAtlasPaths(),
        ])];

        try {
            const [shaderReady] = await Promise.all([
                CharacterTeamColorMaterial.ensureShaderRegistered(),
                Laya.loader.load(paths)
            ]);
            if (!shaderReady) {
                this.failTransition(`角色队伍色 Shader 显式解析失败: ${CharacterTeamColorMaterial.SHADER_PATH}`);
                return;
            }
        } catch (error) {
            this.failTransition("Failed to preload battle unit atlases or shader", error);
            return;
        }
        if (token !== this._battleUnitLoadToken || !this.isReady) return;
        if (!Laya.Shader3D.find(CharacterTeamColorMaterial.SHADER_NAME)) {
            this.failTransition(`角色队伍色 Shader 加载后仍未注册: ${CharacterTeamColorMaterial.SHADER_PATH}`);
            return;
        }
        console.log(`[BattleScene] 角色队伍色 Shader 已就绪: ${CharacterTeamColorMaterial.SHADER_NAME}`);

        this.createTestTeam(2, [
            { configId: 1003, count: 25, startY: 100, rowStepY: 72 },
            { configId: 1001, count: 25, startY: 400, rowStepY: 72 },
        ]);
        this.createTestTeam(1, [
            { configId: 1001, count: 25, startY: 900, rowStepY: -72 },
            { configId: 1003, count: 25, startY: 1200, rowStepY: -72 },
        ]);
        this._battleUnitsReady = true;
        this.transitionFlowState(BattleFlowState.Running);
    }

    private failTransition(message: string, error?: unknown): void {
        this._transitionError = message;
        console.error(`[BattleScene] ${message}`, error || "");
    }

    private evaluateBattleResult(): void {
        if (this._flowState !== BattleFlowState.Running ||
            !this._battleUnitsReady ||
            this._resultUIName !== null ||
            this._resultExitRequested) {
            return;
        }

        let teamOneAlive = 0;
        let teamTwoAlive = 0;
        for (const obj of this._objMap.values()) {
            if (obj.isRelease || obj.isDead || !(obj instanceof CharacterSceneObj)) continue;
            if (obj.team === 1) teamOneAlive++;
            if (obj.team === 2) teamTwoAlive++;
        }

        if (teamOneAlive === 0 && teamTwoAlive === 0) return;
        if (teamTwoAlive === 0) {
            this.finishBattle("victory");
        } else if (teamOneAlive === 0) {
            this.finishBattle("defeat");
        }
    }

    private finishBattle(result: "victory" | "defeat"): void {
        if (this._flowState !== BattleFlowState.Running) return;

        const nextState = result === "victory"
            ? BattleFlowState.Victory
            : BattleFlowState.Defeat;
        if (!this.transitionFlowState(nextState)) return;
        this.setPaused(true);
        if (result === "victory") {
            void this.resolveVictoryResult();
        } else {
            void this.showBattleResult(result);
        }
    }

    private async resolveVictoryResult(): Promise<void> {
        const settlement = await BattleSettlementMgr.instance.requestComplete(this._battleSessionId, "victory");
        if (!settlement.success || !settlement.victory) {
            console.error(`[BattleScene] 战斗胜利结算失败: ${settlement.reason || "unknown"}`);
            await this.showBattleResult("defeat");
            return;
        }
        await this.showBattleResult("victory", settlement);
    }

    private transitionFlowState(nextState: BattleFlowState): boolean {
        const allowed: Record<BattleFlowState, readonly BattleFlowState[]> = {
            [BattleFlowState.Preparing]: [BattleFlowState.Loading],
            [BattleFlowState.Loading]: [BattleFlowState.Running, BattleFlowState.Exiting],
            [BattleFlowState.Running]: [
                BattleFlowState.Victory,
                BattleFlowState.Defeat,
                BattleFlowState.Exiting,
            ],
            [BattleFlowState.Victory]: [BattleFlowState.Exiting],
            [BattleFlowState.Defeat]: [BattleFlowState.Exiting],
            [BattleFlowState.Exiting]: [BattleFlowState.Loading],
        };
        if (this._flowState === nextState) return true;
        if (!allowed[this._flowState].includes(nextState)) {
            console.warn(`[BattleScene] Illegal flow transition: ${this._flowState} -> ${nextState}`);
            return false;
        }
        this._flowState = nextState;
        return true;
    }

    private async showBattleResult(result: "victory" | "defeat", settlement?: BattleCompleteResult): Promise<void> {
        const uiName: BattleResultUIName = result === "victory"
            ? "BattleVictoryUI"
            : "BattleDefeatUI";
        this._resultUIName = uiName;
        try {
            const param = result === "victory"
                ? {
                    score: 0,
                    rewards: this.toRewardViewData(settlement?.rewards || []),
                    onConfirm: () => this.exitAfterBattleResult(),
                }
                : {
                    onConfirm: () => this.exitAfterBattleResult(),
                };
            const controller = await UIManager.instance.open(uiName, param);
            if (!controller) this.exitAfterBattleResult();
        } catch (error) {
            console.error(`[BattleScene] Failed to open ${uiName}`, error);
            this.exitAfterBattleResult();
        }
    }

    private toRewardViewData(rewards: readonly { itemId: number; quantity: number }[]): ItemViewData[] {
        return rewards.map(reward => {
            const item = ItemMgr.instance.getItem(reward.itemId);
            return {
                name: item?.data.Name || `物品 ${reward.itemId}`,
                // Item config has no icon field yet; retain the common currency placeholder until that table adds art mapping.
                iconPath: "ui/common/imgs/currency-crystal.png",
                quantity: reward.quantity,
                quality: Math.max(1, Math.min(5, Number(item?.data.Quality) || 1)) as ItemViewData["quality"],
                showRedPoint: false,
                selected: false,
            };
        });
    }

    private exitAfterBattleResult(): void {
        if (this._resultExitRequested) return;
        if (!this.transitionFlowState(BattleFlowState.Exiting)) return;
        this._resultExitRequested = true;
        void this.setSceneBackToStage();
    }

    private async setSceneBackToStage(): Promise<void> {
        const { SceneMgr } = await import("../scene/SceneMgr");
        const { SceneType } = await import("../scene/SceneType");
        await SceneMgr.instance.switchScene(SceneType.BattleStageScene);
    }

    private createTestTeam(
        team: number,
        formation: readonly BattleTestFormationRow[]
    ): void {
        for (const row of formation) {
            for (let index = 0; index < row.count; index++) {
                const column = index % BATTLE_TEST_COLUMNS;
                const line = Math.floor(index / BATTLE_TEST_COLUMNS);
                const unit = this.addObjectToScene(
                    "CharacterSceneObj",
                    row.configId,
                    team,
                    BATTLE_TEST_START_X + column * BATTLE_TEST_COLUMN_STEP,
                    row.startY + line * row.rowStepY,
                    0
                );
                if (unit instanceof CharacterSceneObj) {
                    unit.showHealthBar(true, {
                        showMpBar: false,
                    });
                }
            }
        }
    }
}

// @regClass 绑定编辑器资源身份；显式注册运行时按名查找的 key。
Laya.ClassUtils.regClass("BattleScene", BattleScene);
