/** Battle stage selection and the first real battle scene. */
const { regClass } = Laya;
import { BaseScene } from "../scene/BaseScene";
import { SceneMgr } from "../scene/SceneMgr";
import { SceneType } from "../scene/SceneType";
import { SceneLayerType } from "../scene/SceneLayerType";
import { ConfigMgr } from "../config/ConfigMgr";
import { CharacterConfigInfo } from "../sceneObj/CharacterConfigInfo";
import { CharacterSceneObj } from "../sceneObj/CharacterSceneObj";
import { CharacterTeamColorMaterial } from "../sceneObj/CharacterTeamColorMaterial";

const BATTLE_UI_PATH = "ui/battlescene/imgs/";
const STAGE_PREFAB_FALLBACK = "ui/battlescene/stage001.lh";
const NORMAL_STAGE_ICON = `${BATTLE_UI_PATH}stage_route_flag.png`;
const BOSS_STAGE_ICON = `${BATTLE_UI_PATH}stage_node_boss.png`;

/**
 * 征战关卡选择场景。
 *
 * 底图由 ImageSceneMap 加载，场景相机只允许竖向拖拽；关卡节点位于地图世界坐标，
 * 因此拖动地图时节点会和道路一起移动。第一版只开放一个关卡节点。
 */
@regClass()
export class BattleStageScene extends BaseScene {
    private _stageRoot: Laya.Sprite | null = null;
    private _stageNodeHandlers: Array<{ node: Laya.Node; handler: () => void }> = [];
    private _stageHitTargets: Array<{ node: Laya.Sprite; stageId: number; battleId: number }> = [];
    private _stageLoadToken = 0;
    private _lastStageActivationAt = 0;
    private _pointerDownX = 0;
    private _pointerDownY = 0;
    private _initialPositioned = false;

    onEnter(param?: any): void {
        super.onEnter(param);
        this._stageLoadToken++;
        this.camera?.enableDrag(false, true);
        if (this.camera) this.camera.camera2D.mouseEnabled = false;
        this._initialPositioned = false;
    }

    protected onUpdate(curTime: number, dt: number): void {
        super.onUpdate(curTime, dt);
        if (!this.isReady) return;

        if (!this._initialPositioned) {
            this._initialPositioned = true;
            const mapHeight = this.map?.height || Number(this._sceneConfig?.mapHeight) || 1400;
            this.camera?.moveTo(0, Math.max(0, mapHeight - Laya.stage.height));
            this.createStageControls();
        }
    }

    onExit(): void {
        this._stageLoadToken++;
        this.destroyStageControls();
        super.onExit();
    }

    private createStageControls(): void {
        if (this._stageRoot) return;

        const groundLayer = this.getSafeLayer(SceneLayerType.Ground);
        if (!groundLayer) return;

        // LayerMgr 已经为各直接场景层设置命中策略，这里不再向上修改父层属性。
        // Sprite 子节点的 CLICK 在 Camera2D/场景层组合下可能不会正常到达节点。
        // 场景级监听作为兜底，使用关卡热点的全局坐标进行命中判断。
        Laya.stage.on(Laya.Event.CLICK, this, this.onStageClick);
        Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.onStagePointerTrace);
        Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onStagePointerTrace);
        void this.loadStagePrefab(groundLayer);
        /*

        // 顶部区域由跨场景 MainUI 壳层占用，征战场景自己的操作从其下方开始。
        this._title = this.createText(hudLayer, "征战", 250, 132, 250, 52, 28);
        this._backButton = this.createButton(hudLayer, "返回主城", 18, 132, 156, 64);
        this._backButton.on(Laya.Event.CLICK, this, this.backToMainScene);
        this._backLabel = this._backButton.getChildByName("label") as Laya.GTextField;
        */
    }

    private async loadStagePrefab(groundLayer: Laya.Sprite): Promise<void> {
        const prefabPath = this._sceneConfig?.stagePrefab || STAGE_PREFAB_FALLBACK;
        const token = this._stageLoadToken;
        try {
            const prefab = await Laya.loader.load(prefabPath) as Laya.Prefab;
            if (token !== this._stageLoadToken || !prefab) return;

            const root = prefab.create() as Laya.Sprite;
            if (!root) return;

            const mapImage = root.getChildByName("img") as any;
            const sourceWidth = Number(mapImage?.width) || 1024;
            const sourceHeight = Number(mapImage?.height) || 2048;
            const targetWidth = Number(this._sceneConfig?.mapWidth) || sourceWidth;
            const targetHeight = Number(this._sceneConfig?.mapHeight) || sourceHeight;
            root.scale(targetWidth / sourceWidth, targetHeight / sourceHeight);
            root.pos((Laya.stage.width - targetWidth) * 0.5, 0);
            root.mouseEnabled = true;
            (root as any).mouseThrough = false;
            groundLayer.addChild(root);
            this._stageRoot = root;

            await Laya.loader.load([NORMAL_STAGE_ICON, BOSS_STAGE_ICON]);
            if (token !== this._stageLoadToken) return;
            this.bindStageNodes(root);
        } catch (error) {
            console.error(`[BattleStageScene] 加载大关 prefab 失败: ${prefabPath}`, error);
        }
    }

    private bindStageNodes(root: Laya.Sprite): void {
        const stageNodes: Laya.Node[] = [];
        for (let i = 0; i < root.numChildren; i++) {
            const child = root.getChildAt(i);
            if (/^stage\d+$/i.test(child?.name || "")) stageNodes.push(child);
        }
        this.validateStageNodeCoverage(stageNodes);
        for (const node of stageNodes) {
            const stageId = Number((node.name || "").slice(5));
            const config = ConfigMgr.instance.getConfig<any>("BattleStage", stageId);
            if (!config) {
                console.warn(`[BattleStageScene] 找不到关卡配置: stageId=${stageId}`);
                continue;
            }

            const copyType = String(config.copyType || config.stageType || config.dungeonType || "normal").toLowerCase();
            const iconPath = copyType === "boss"
                ? BOSS_STAGE_ICON
                : NORMAL_STAGE_ICON;
            const texture = Laya.loader.getRes(iconPath) as Laya.Texture;
            const sourceNode = node as any;
            if (texture && "texture" in sourceNode) sourceNode.texture = texture;

            const hotspot = new Laya.Sprite();
            hotspot.name = `StageHotspot_${stageId}`;
            const nodeWidth = Number(sourceNode.width) || 120;
            const nodeHeight = Number(sourceNode.height) || 120;
            const anchorX = Number(sourceNode.anchorX) || 0;
            const anchorY = Number(sourceNode.anchorY) || 0;
            hotspot.pos(
                (Number(sourceNode.x) || 0) - nodeWidth * anchorX,
                (Number(sourceNode.y) || 0) - nodeHeight * anchorY
            );
            hotspot.size(nodeWidth, nodeHeight);
            hotspot.graphics.drawRect(0, 0, hotspot.width, hotspot.height, "#000000");
            hotspot.alpha = 0.01;
            hotspot.mouseEnabled = config.canEnter !== false;
            hotspot.mouseThrough = false;
            hotspot.hitArea = {
                contains: (x: number, y: number): boolean =>
                    x >= 0 && y >= 0 && x <= nodeWidth && y <= nodeHeight,
            };
            root.addChild(hotspot);

            const handler = () => this.enterStage(stageId, Number(config.battleId || stageId));
            hotspot.on(Laya.Event.CLICK, this, handler);
            this._stageNodeHandlers.push({ node: hotspot, handler });
            this._stageHitTargets.push({
                node: hotspot,
                stageId,
                battleId: Number(config.battleId || stageId),
            });
            console.log(`[BattleStageScene] 关卡节点已绑定: stageId=${stageId}, copyType=${copyType}, icon=${iconPath}`);
        }
    }

    private validateStageNodeCoverage(stageNodes: readonly Laya.Node[]): void {
        const nodeNames = new Set(stageNodes.map(node => node.name));
        const configuredStages = ConfigMgr.instance.getAll<any>("BattleStage");
        for (const config of configuredStages) {
            const nodeName = `stage${config.ID}`;
            if (!nodeNames.has(nodeName)) {
                console.warn(`[BattleStageScene] 关卡配置缺少 prefab 节点: ${nodeName}`);
            }
        }

        const occupiedPositions = new Map<string, string>();
        for (const node of stageNodes) {
            const positionKey = `${Number((node as any).x) || 0}:${Number((node as any).y) || 0}`;
            const previousNode = occupiedPositions.get(positionKey);
            if (previousNode) {
                console.warn(`[BattleStageScene] 关卡节点坐标重叠: ${previousNode}, ${node.name}, position=${positionKey}`);
            } else {
                occupiedPositions.set(positionKey, node.name);
            }
        }
    }

    /**
     * Sprite 点击兜底：不依赖 prefab 子节点的事件冒泡，直接按当前舞台坐标命中热点。
     * 只接受舞台或大关 prefab 内部的事件，避免底部 MainUI 覆盖层误触发关卡。
     */
    private onStageClick(event: Laya.Event): void {
        const root = this._stageRoot;
        if (!root || !this._stageHitTargets.length) return;

        const target = event?.target as Laya.Node | null;
        const isRootClick = target === Laya.stage
            || target === Laya.GRoot.inst
            || target?.name === "Scene2D"
            || target?.name === "MainUI";
        if (target && !isRootClick && !this.isDescendantOf(target, root)) {
            console.log(`[BattleStageScene] 点击被 UI 子节点接收: target=${target.name || target.constructor?.name || "unknown"}`);
            return;
        }
        console.log(`[BattleStageScene] 收到场景点击: target=${target?.name || target?.constructor?.name || "unknown"}, x=${Laya.stage.mouseX}, y=${Laya.stage.mouseY}`);

        const point = new Laya.Point(Laya.stage.mouseX, Laya.stage.mouseY);
        for (let i = this._stageHitTargets.length - 1; i >= 0; i--) {
            const hitTarget = this._stageHitTargets[i];
            if (!hitTarget.node || !hitTarget.node.mouseEnabled) continue;

            const localPoint = hitTarget.node.globalToLocal(point, true);
            if (localPoint.x < 0 || localPoint.y < 0 ||
                localPoint.x > hitTarget.node.width || localPoint.y > hitTarget.node.height) {
                continue;
            }
            this.enterStage(hitTarget.stageId, hitTarget.battleId);
            return;
        }
    }

    private isDescendantOf(node: Laya.Node, ancestor: Laya.Node): boolean {
        let current: Laya.Node | null = node;
        while (current) {
            if (current === ancestor) return true;
            current = current.parent;
        }
        return false;
    }

    private onStagePointerTrace(event: Laya.Event): void {
        const target = event?.target as Laya.Node | null;
        console.log(`[BattleStageScene] 指针事件: type=${event?.type || "unknown"}, target=${target?.name || target?.constructor?.name || "unknown"}, x=${Laya.stage.mouseX}, y=${Laya.stage.mouseY}`);
        if (event?.type === Laya.Event.MOUSE_DOWN) {
            this._pointerDownX = Laya.stage.mouseX;
            this._pointerDownY = Laya.stage.mouseY;
            return;
        }

        if (event?.type === Laya.Event.MOUSE_UP) {
            const dx = Laya.stage.mouseX - this._pointerDownX;
            const dy = Laya.stage.mouseY - this._pointerDownY;
            if (dx * dx + dy * dy <= 12 * 12) {
                this.onStageClick(event);
            }
        }
    }

    private destroyStageControls(): void {
        Laya.stage.off(Laya.Event.CLICK, this, this.onStageClick);
        Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this.onStagePointerTrace);
        Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onStagePointerTrace);
        for (const binding of this._stageNodeHandlers) {
            binding.node.off(Laya.Event.CLICK, this, binding.handler);
        }
        this._stageNodeHandlers.length = 0;
        this._stageHitTargets.length = 0;
        this._stageRoot?.destroy();
        this._stageRoot = null;
    }

    private enterStage(stageId: number, battleId: number): void {
        // 子节点 CLICK 与舞台级兜底可能在同一事件中同时触发，只允许进入一次。
        const now = Date.now();
        if (now - this._lastStageActivationAt < 150) return;
        this._lastStageActivationAt = now;
        console.log(`[BattleStageScene] 点击关卡: stageId=${stageId}, battleId=${battleId}`);
        void SceneMgr.instance.switchScene(SceneType.BattleScene, { stageId, battleId }).then(scene => {
            if (!scene) {
                console.error(`[BattleStageScene] 进入战斗场景失败: stageId=${stageId}, battleId=${battleId}`);
            }
        });
    }

}

/** 第一关实际战斗场景，加载配置指定的 TiledMap。 */
@regClass()
export class BattleScene extends BaseScene {
    private static readonly BATTLE_LAYOUT_TRACE_INTERVAL = 0.2;

    private _paused = false;
    private _battleUnitsCreated = false;
    private _battleUnitLoadToken = 0;
    private _lastBattleLayoutTrace = "";
    private _lastBattleLayoutTraceAt = -Infinity;
    private _nextBattleLayoutTraceAt = 0;
    private _lastBattleAliveCount = "";

    onEnter(param?: any): void {
        this._paused = false;
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

    protected onUpdate(curTime: number, dt: number): void {
        if (this._paused) return;
        super.onUpdate(curTime, dt);
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
        this._paused = false;
        this._battleUnitLoadToken++;
        this._battleUnitsCreated = false;
        this._lastBattleLayoutTrace = "";
        this._lastBattleLayoutTraceAt = -Infinity;
        this._nextBattleLayoutTraceAt = 0;
        this._lastBattleAliveCount = "";
        super.onExit();
    }

    setPaused(paused: boolean): void {
        if (this._paused === paused) return;
        this._paused = paused;
        if (paused) this._sceneTime.pause();
        else this._sceneTime.resume();
    }

    get isPaused(): boolean {
        return this._paused;
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

// 场景类 runtime lookup 注册：@regClass 绑定编辑器资源身份，
// 此处显式注册运行时按名查找的 key，供 SceneMgr.createScene 使用。
Laya.ClassUtils.regClass("BattleStageScene", BattleStageScene);
Laya.ClassUtils.regClass("BattleScene", BattleScene);
