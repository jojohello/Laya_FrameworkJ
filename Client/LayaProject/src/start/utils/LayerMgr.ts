// jojohello 2023-05-16
// 在 Laya 舞台里建立场景层；UI 层直接挂到 GRoot，通过 zOrder 控制层级。

export type LayerName =
    | "BelowScene"
    | "Scene"
    | "AboveScene"
    | "MainUI"
    | "UIWindow"
    | "TipWindow"
    | "Login"
    | "UpTipWindow"
    | "Top";

export class LayerMgr {
    static readonly BelowScene = 1;
    static readonly Scene = 10;
    static readonly AboveScene = 30;

    static readonly MainUI = 100;
    static readonly UIWindow = 200;
    static readonly TipWindow = 400;
    static readonly Login = 500;
    static readonly UpTipWindow = 600;
    static readonly Top = 700;

    private static readonly SCENE_LAYER_NAMES: LayerName[] = [
        "BelowScene",
        "Scene",
        "AboveScene",
    ];

    private static readonly UI_LAYER_NAMES: LayerName[] = [
        "MainUI",
        "UIWindow",
        "TipWindow",
        "Login",
        "UpTipWindow",
        "Top",
    ];

    /** 场景实体层。UI 层不创建实体容器，避免容器尺寸影响命中和关系计算。 */
    static layers: { [key: string]: Laya.Sprite } = {};
    static scene: Laya.Sprite;
    static uiRoot: Laya.GRoot;

    public static init(): void {
        LayerMgr.uiRoot = Laya.GRoot.inst;

        if (LayerMgr.scene && !LayerMgr.scene.destroyed) {
            LayerMgr.refreshLayerSizes();
            return;
        }

        LayerMgr.layers = {};

        LayerMgr.scene = new Laya.Sprite();
        LayerMgr.scene.name = "SceneRoot";
        Laya.stage.addChild(LayerMgr.scene);

        if (!LayerMgr.uiRoot) {
            console.error("LayerMgr: GRoot 未初始化，无法挂载 UI");
        }

        LayerMgr.SCENE_LAYER_NAMES.forEach(layerName => {
            const layer = LayerMgr.createSpriteLayer(layerName);
            LayerMgr.scene.addChild(layer);
            LayerMgr.layers[layerName] = layer;
        });

        LayerMgr.refreshLayerSizes();
        Laya.stage.on(Laya.Event.RESIZE, LayerMgr, LayerMgr.onResize);
    }

    private static createSpriteLayer(layerName: LayerName): Laya.Sprite {
        const layer = new Laya.Sprite();
        layer.name = layerName;
        layer.zOrder = LayerMgr.getLayerZOrder(layerName);
        return layer;
    }

    private static onResize(): void {
        LayerMgr.refreshLayerSizes();
    }

    public static refreshLayerSizes(): void {
        if (LayerMgr.scene && !LayerMgr.scene.destroyed) {
            LayerMgr.scene.width = Laya.stage.width;
            LayerMgr.scene.height = Laya.stage.height;
        }

        LayerMgr.SCENE_LAYER_NAMES.forEach(layerName => {
            const layer = LayerMgr.layers[layerName];
            if (!layer) return;

            layer.width = Laya.stage.width;
            layer.height = Laya.stage.height;
        });
    }

    public static getLayerZOrder(layerName: LayerName): number {
        return (LayerMgr as any)[layerName] ?? 0;
    }

    public static isUILayer(layerName: LayerName): boolean {
        return LayerMgr.UI_LAYER_NAMES.includes(layerName);
    }

    /**
     * 将节点挂载到指定层。
     * Scene 层挂到实体场景层；UI 层直接挂到 GRoot，并设置层级 zOrder。
     */
    static setLayer(child: Laya.Sprite, layerName: LayerName): void {
        const sceneLayer = LayerMgr.layers[layerName];
        if (sceneLayer) {
            sceneLayer.addChild(child);
            return;
        }

        if (LayerMgr.isUILayer(layerName)) {
            const uiRoot = LayerMgr.uiRoot || Laya.GRoot.inst;
            if (!uiRoot) {
                console.error(`LayerMgr: GRoot 未初始化，无法挂载 UI 层 ${layerName}`);
                return;
            }

            child.zOrder = LayerMgr.getLayerZOrder(layerName);
            uiRoot.addChild(child);
            return;
        }

        console.error(`LayerMgr: 未找到层级 ${layerName}`);
    }
}

(Laya.Browser.window as any)["LayerMgr"] = LayerMgr;
