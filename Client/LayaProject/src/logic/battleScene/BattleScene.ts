/** First real battle scene. */
const { regClass } = Laya;
import { BaseScene } from "../scene/BaseScene";
import { ConfigMgr } from "../config/ConfigMgr";
import { CharacterConfigInfo } from "../sceneObj/CharacterConfigInfo";
import { CharacterSceneObj } from "../sceneObj/CharacterSceneObj";
import { CharacterTeamColorMaterial } from "../sceneObj/CharacterTeamColorMaterial";
import { SceneTime, SceneTimeMode } from "../scene/SceneTime";
import { AIScheduler, AIOwnerResolver } from "../ai/AIScheduler";
import { SimpleCombatAIAgent } from "../ai/SimpleCombatAI";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";

/** 第一关实际战斗场景，加载配置指定的 TiledMap。 */
@regClass()
export class BattleScene extends BaseScene implements AIOwnerResolver<CharacterSceneObj> {
    private static readonly BATTLE_LAYOUT_TRACE_INTERVAL = 0.2;

    private _battleUnitsCreated = false;
    private _battleUnitLoadToken = 0;
    private _lastBattleLayoutTrace = "";
    private _lastBattleLayoutTraceAt = -Infinity;
    private _nextBattleLayoutTraceAt = 0;
    private _lastBattleAliveCount = "";
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
        this._battleUnitLoadToken++;
        this._lastBattleLayoutTrace = "";
        this._lastBattleLayoutTraceAt = -Infinity;
        this._nextBattleLayoutTraceAt = 0;
        this._lastBattleAliveCount = "";
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
        this._aiScheduler.update(curTime, tick, this);
        super.logicUpdate(logicDt, curTime, tick);
        if (this.isReady && !this._battleUnitsCreated) {
            this._battleUnitsCreated = true;
            void this.createBattleUnits();
        }
        this.traceBattleLayout(curTime);
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
        this._battleUnitLoadToken++;
        this._battleUnitsCreated = false;
        this._lastBattleLayoutTrace = "";
        this._lastBattleLayoutTraceAt = -Infinity;
        this._nextBattleLayoutTraceAt = 0;
        this._lastBattleAliveCount = "";
        super.onExit();
        this._aiScheduler.clear();
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

    private traceBattleLayout(curTime: number): void {
        if (curTime < this._nextBattleLayoutTraceAt) return;
        this._nextBattleLayoutTraceAt = curTime + BattleScene.BATTLE_LAYOUT_TRACE_INTERVAL;

        const units = Array.from(this._objMap.values())
            .filter((obj): obj is CharacterSceneObj => obj instanceof CharacterSceneObj);
        if (units.length === 0) return;

        const records = units.map(unit => {
            const model = unit.model;
            const parent = model?.parent as Laya.Sprite | null;
            return {
                uid: unit.uid,
                cfgId: unit.configId,
                team: unit.team,
                dead: unit.isDead,
                release: unit.isRelease,
                x: Math.round(unit.x),
                y: Math.round(unit.y),
                modelX: model ? Math.round(model.x) : null,
                modelY: model ? Math.round(model.y) : null,
                visible: model?.visible ?? false,
                parent: parent?.name || null,
                parentIndex: model && parent ? parent.getChildIndex(model) : -1,
                zOrder: model ? Number((model as any).zOrder) || 0 : null,
            };
        }).sort((left, right) => left.uid - right.uid);

        const alive = records.filter(record => !record.dead && !record.release);
        const blue = alive.filter(record => record.team === 1);
        const red = alive.filter(record => record.team === 2);
        const closePairs: Array<Record<string, unknown>> = [];
        for (const blueUnit of blue) {
            for (const redUnit of red) {
                const dx = blueUnit.x - redUnit.x;
                const dy = blueUnit.y - redUnit.y;
                const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
                if (distance <= 220) {
                    closePairs.push({
                        blueUid: blueUnit.uid,
                        redUid: redUnit.uid,
                        distance,
                    });
                }
            }
        }

        const signature = records.map(record => [
            record.uid,
            record.team,
            record.dead ? 1 : 0,
            record.release ? 1 : 0,
            Math.round(record.x / 32),
            Math.round(record.y / 32),
            record.visible ? 1 : 0,
            record.parentIndex,
            record.zOrder,
        ].join(":" )).join("|");
        const aliveCount = `${blue.length}:${red.length}`;
        const countChanged = aliveCount !== this._lastBattleAliveCount;
        const important = countChanged || closePairs.length > 0 || blue.length <= 1 || red.length <= 1;
        if (!important || signature === this._lastBattleLayoutTrace) return;
        if (curTime - this._lastBattleLayoutTraceAt < 0.2 && closePairs.length === 0) return;

        this._lastBattleLayoutTrace = signature;
        this._lastBattleLayoutTraceAt = curTime;
        this._lastBattleAliveCount = aliveCount;
        console.log("[BattleLayoutTrace]", JSON.stringify({
            time: Number(curTime.toFixed(2)),
            aliveCount: { blue: blue.length, red: red.length },
            closePairs,
            units: records,
        }));
    }

    private async createBattleUnits(): Promise<void> {
        const token = this._battleUnitLoadToken;
        const configIds = [1001, 1002, 1003];
        const paths = configIds.flatMap(cfgId => {
            const config = ConfigMgr.instance.getConfig<CharacterConfigInfo>("Character", cfgId);
            return config ? [config.modelPath, config.teamMaskPath].filter(Boolean) : [];
        });

        try {
            const [shaderReady] = await Promise.all([
                CharacterTeamColorMaterial.ensureShaderRegistered(),
                Laya.loader.load(paths)
            ]);
            if (!shaderReady) {
                console.error(`[BattleScene] 角色队伍色 Shader 显式解析失败: ${CharacterTeamColorMaterial.SHADER_PATH}`);
                return;
            }
        } catch (error) {
            console.error("[BattleScene] Failed to preload battle unit textures or shader", error);
            return;
        }
        if (token !== this._battleUnitLoadToken || !this.isReady) return;
        if (!Laya.Shader3D.find(CharacterTeamColorMaterial.SHADER_NAME)) {
            console.error(`[BattleScene] 角色队伍色 Shader 加载后仍未注册: ${CharacterTeamColorMaterial.SHADER_PATH}`);
            return;
        }
        console.log(`[BattleScene] 角色队伍色 Shader 已就绪: ${CharacterTeamColorMaterial.SHADER_NAME}`);

        const columns = [220, 384, 548];
        this.createTeamUnits(2, 220, columns, configIds);
        this.createTeamUnits(1, 1120, columns, configIds);
    }

    private createTeamUnits(
        team: number,
        y: number,
        columns: number[],
        configIds: number[]
    ): void {
        for (let i = 0; i < configIds.length; i++) {
            this.addObjectToScene(
                "CharacterSceneObj",
                configIds[i],
                team,
                columns[i],
                y,
                0
            );
        }
    }
}

// @regClass 绑定编辑器资源身份；显式注册运行时按名查找的 key。
Laya.ClassUtils.regClass("BattleScene", BattleScene);
