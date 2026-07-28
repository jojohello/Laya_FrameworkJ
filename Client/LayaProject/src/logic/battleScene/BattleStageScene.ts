/** Battle stage selection scene. */
const { regClass } = Laya;
import { ConfigMgr } from "../config/ConfigMgr";
import { BaseScene } from "../scene/BaseScene";
import { SceneLayerType } from "../scene/SceneLayerType";
import { SceneMgr } from "../scene/SceneMgr";
import { SceneType } from "../scene/SceneType";
import { BattleSettlementMgr } from "./BattleSettlementMgr";

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
    private _lastStageActivationWallClockMs = 0;
    private _pointerDownX = 0;
    private _pointerDownY = 0;
    private _initialPositioned = false;

    onEnter(param?: any): void {
        super.onEnter(param);
        this._stageLoadToken++;
        this.camera?.enableDrag(false, true);
        if (this.camera) this.camera.camera2D.mouseEnabled = false;
        this._initialPositioned = false;
        this._lastStageActivationWallClockMs = 0;
    }

    protected logicUpdate(logicDt: number, curTime: number, tick: number): void {
        super.logicUpdate(logicDt, curTime, tick);
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
            return;
        }

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
        const wallClockNowMs = Date.now();
        if (wallClockNowMs - this._lastStageActivationWallClockMs < 150) return;
        this._lastStageActivationWallClockMs = wallClockNowMs;

        void BattleSettlementMgr.instance.requestEnter(stageId).then(enter => {
            if (!enter.success || !enter.battleSessionId) {
                console.warn(`[BattleStageScene] 服务器拒绝进入战斗: stageId=${stageId}, reason=${enter.reason || "unknown"}`);
                return null;
            }
            return SceneMgr.instance.switchSceneWithLoading(
                SceneType.BattleScene,
                { stageId, battleId, battleSessionId: enter.battleSessionId },
                "战斗加载中"
            );
        }).then(scene => {
            if (!scene) {
                console.error(`[BattleStageScene] 进入战斗场景失败: stageId=${stageId}, battleId=${battleId}`);
            }
        });
    }
}

// @regClass 绑定编辑器资源身份；显式注册运行时按名查找的 key。
Laya.ClassUtils.regClass("BattleStageScene", BattleStageScene);
