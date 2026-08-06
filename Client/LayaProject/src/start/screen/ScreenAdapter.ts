export type ScreenAspectClass = "classic" | "long" | "tall" | "ultra";

export interface ScreenInsets {
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
}

export interface ScreenRect {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

export interface ScreenLayoutSnapshot {
    readonly stageWidth: number;
    readonly stageHeight: number;
    readonly windowWidth: number;
    readonly windowHeight: number;
    readonly aspectRatio: number;
    readonly aspectClass: ScreenAspectClass;
    readonly safeInsets: ScreenInsets;
    readonly safeRect: ScreenRect;
    readonly menuButtonRect: ScreenRect | null;
    readonly source: "wechat" | "douyin" | "platform" | "css" | "ratio-fallback" | "viewport";
    readonly confidence: "exact" | "estimated" | "none";
}

interface PlatformWindowData {
    readonly source: ScreenLayoutSnapshot["source"];
    readonly api: any;
    readonly info: any;
}

interface SafeInsetsResult {
    readonly insets: ScreenInsets;
    readonly source: ScreenLayoutSnapshot["source"];
    readonly confidence: ScreenLayoutSnapshot["confidence"];
}

const EMPTY_INSETS: ScreenInsets = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });

/**
 * Owns the runtime screen contract shared by Start and the Logic bundle.
 * Platform pixels are converted once into current Laya stage coordinates; views
 * must consume this snapshot instead of branching on device model names.
 */
export class ScreenAdapter {
    public static readonly CHANGED = "screen-layout-changed";

    private static _instance: ScreenAdapter;

    public static get instance(): ScreenAdapter {
        if (!this._instance) this._instance = new ScreenAdapter();
        return this._instance;
    }

    private readonly _events = new Laya.EventDispatcher();
    private _initialized = false;
    private _layout: ScreenLayoutSnapshot = this.createViewportSnapshot();

    private constructor() {}

    public get layout(): Readonly<ScreenLayoutSnapshot> {
        return this._layout;
    }

    public init(): void {
        if (this._initialized) {
            this.refresh();
            return;
        }

        this._initialized = true;
        Laya.stage.on(Laya.Event.RESIZE, this, this.handleStageResize);
        (Laya.Browser.window as any).screenAdapter = this;
        this.refresh();
    }

    public onChanged(caller: any, listener: (layout: Readonly<ScreenLayoutSnapshot>) => void): void {
        this._events.on(ScreenAdapter.CHANGED, caller, listener);
    }

    public offChanged(caller: any, listener: (layout: Readonly<ScreenLayoutSnapshot>) => void): void {
        this._events.off(ScreenAdapter.CHANGED, caller, listener);
    }

    public refresh(): Readonly<ScreenLayoutSnapshot> {
        this._layout = this.createViewportSnapshot();
        this._events.event(ScreenAdapter.CHANGED, [this._layout]);
        return this._layout;
    }

    /**
     * Attaches the generic safe-area component only when a scene declares a
     * `safeAreaRoot` GBox. Logic calls this through the window bridge so it
     * does not statically import Start runtime code into the logic bundle.
     */
    public bind(view: Laya.Node): SafeAreaLayout | null {
        const safeAreaRoot = view.getChildByName(SafeAreaLayout.SAFE_AREA_ROOT_NAME);
        if (!safeAreaRoot) return null;
        if (!(safeAreaRoot instanceof Laya.GBox)) {
            throw new Error("safeAreaRoot 必须是普通 GBox");
        }
        return view.getComponent(SafeAreaLayout) || view.addComponent(SafeAreaLayout);
    }

    private handleStageResize(): void {
        this.refresh();
    }

    private createViewportSnapshot(): ScreenLayoutSnapshot {
        const stageWidth = this.positiveOr(Laya.stage?.width, 750);
        const stageHeight = this.positiveOr(Laya.stage?.height, 1334);
        const platform = this.readPlatformWindowData();
        const info = platform?.info;
        const windowWidth = this.positiveOr(info?.windowWidth, this.positiveOr(Laya.Browser.clientWidth, stageWidth));
        const windowHeight = this.positiveOr(info?.windowHeight, this.positiveOr(Laya.Browser.clientHeight, stageHeight));
        // fixedwidth uses one uniform CSS/platform-pixel -> Stage scale. Using
        // independent X/Y factors subtly distorts inset coordinates when the
        // engine rounds the dynamic Stage height.
        const stageScale = stageWidth / windowWidth;
        const aspectRatio = windowHeight / windowWidth;
        const safeResult = this.resolveSafeInsets(
            platform, stageWidth, stageHeight, stageScale, aspectRatio);
        const safeInsets = safeResult.insets;
        const menuButtonRect = this.resolveMenuButtonRect(platform, stageScale);

        return Object.freeze({
            stageWidth,
            stageHeight,
            windowWidth,
            windowHeight,
            aspectRatio,
            aspectClass: this.classifyAspect(aspectRatio),
            safeInsets,
            safeRect: Object.freeze({
                x: safeInsets.left,
                y: safeInsets.top,
                width: Math.max(0, stageWidth - safeInsets.left - safeInsets.right),
                height: Math.max(0, stageHeight - safeInsets.top - safeInsets.bottom),
            }),
            menuButtonRect,
            source: safeResult.source,
            confidence: safeResult.confidence,
        });
    }

    private readPlatformWindowData(): PlatformWindowData | null {
        const runtime = Laya.Browser.window as any;
        const candidates: Array<{ source: PlatformWindowData["source"]; api: any }> = [
            { source: "wechat", api: runtime.wx },
            { source: "douyin", api: runtime.tt },
            { source: "platform", api: runtime.qg },
        ];

        for (const candidate of candidates) {
            const api = candidate.api;
            if (!api) continue;
            try {
                const info = typeof api.getWindowInfo === "function"
                    ? api.getWindowInfo()
                    : typeof api.getSystemInfoSync === "function"
                        ? api.getSystemInfoSync()
                        : null;
                if (info && this.positiveOr(info.windowWidth, 0) > 0 && this.positiveOr(info.windowHeight, 0) > 0) {
                    return { source: candidate.source, api, info };
                }
            } catch (error) {
                console.warn("[ScreenAdapter] 读取平台窗口信息失败，改用 viewport", error);
            }
        }
        return null;
    }

    private resolveSafeInsets(
        platform: PlatformWindowData | null,
        stageWidth: number,
        stageHeight: number,
        stageScale: number,
        aspectRatio: number,
    ): SafeInsetsResult {
        const info = platform?.info;
        const safeArea = info?.safeArea;
        if (safeArea) {
            const screenTop = Number.isFinite(info.screenTop) ? info.screenTop : 0;
            const windowWidth = this.positiveOr(info.windowWidth, stageWidth / stageScale);
            const windowHeight = this.positiveOr(info.windowHeight, stageHeight / stageScale);
            return {
                insets: Object.freeze({
                    top: this.clamp((this.finiteOr(safeArea.top, screenTop) - screenTop) * stageScale, 0, stageHeight),
                    right: this.clamp((windowWidth - this.finiteOr(safeArea.right, windowWidth)) * stageScale, 0, stageWidth),
                    bottom: this.clamp((screenTop + windowHeight - this.finiteOr(safeArea.bottom, screenTop + windowHeight)) * stageScale, 0, stageHeight),
                    left: this.clamp(this.finiteOr(safeArea.left, 0) * stageScale, 0, stageWidth),
                }),
                source: platform?.source || "platform",
                confidence: "exact",
            };
        }

        const cssInsets = this.readCssSafeInsets(stageWidth, stageHeight, stageScale);
        if (cssInsets) {
            return { insets: cssInsets, source: "css", confidence: "exact" };
        }

        // A simulator/legacy platform can expose the viewport but not a physical
        // cutout. The conservative estimate is explicit in the snapshot so QA
        // never mistakes it for platform evidence.
        if (aspectRatio >= 2) {
            const designScale = stageWidth / 750;
            return {
                insets: Object.freeze({
                    top: 90 * designScale,
                    right: 0,
                    bottom: 65 * designScale,
                    left: 0,
                }),
                source: "ratio-fallback",
                confidence: "estimated",
            };
        }
        return {
            insets: EMPTY_INSETS,
            source: platform?.source || "viewport",
            confidence: "none",
        };
    }

    private readCssSafeInsets(
        stageWidth: number,
        stageHeight: number,
        stageScale: number,
    ): ScreenInsets | null {
        const document = (Laya.Browser.window as any).document as Document | undefined;
        if (!document?.body || typeof document.defaultView?.getComputedStyle !== "function") return null;
        const probe = document.createElement("div");
        probe.style.cssText = [
            "position:fixed",
            "visibility:hidden",
            "pointer-events:none",
            "padding-top:env(safe-area-inset-top,0px)",
            "padding-right:env(safe-area-inset-right,0px)",
            "padding-bottom:env(safe-area-inset-bottom,0px)",
            "padding-left:env(safe-area-inset-left,0px)",
        ].join(";");
        document.body.appendChild(probe);
        try {
            const style = document.defaultView.getComputedStyle(probe);
            const insets = {
                top: this.clamp((parseFloat(style.paddingTop) || 0) * stageScale, 0, stageHeight),
                right: this.clamp((parseFloat(style.paddingRight) || 0) * stageScale, 0, stageWidth),
                bottom: this.clamp((parseFloat(style.paddingBottom) || 0) * stageScale, 0, stageHeight),
                left: this.clamp((parseFloat(style.paddingLeft) || 0) * stageScale, 0, stageWidth),
            };
            return Object.values(insets).some(value => value > 0) ? Object.freeze(insets) : null;
        } finally {
            probe.remove();
        }
    }

    private resolveMenuButtonRect(
        platform: PlatformWindowData | null,
        stageScale: number,
    ): ScreenRect | null {
        if (!platform || typeof platform.api.getMenuButtonBoundingClientRect !== "function") return null;
        try {
            const rect = platform.api.getMenuButtonBoundingClientRect();
            if (!rect || this.positiveOr(rect.width, 0) <= 0 || this.positiveOr(rect.height, 0) <= 0) return null;
            const screenTop = Number.isFinite(platform.info.screenTop) ? platform.info.screenTop : 0;
            return Object.freeze({
                x: this.finiteOr(rect.left, 0) * stageScale,
                y: (this.finiteOr(rect.top, screenTop) - screenTop) * stageScale,
                width: this.positiveOr(rect.width, 0) * stageScale,
                height: this.positiveOr(rect.height, 0) * stageScale,
            });
        } catch (error) {
            console.warn("[ScreenAdapter] 读取平台胶囊位置失败", error);
            return null;
        }
    }

    private classifyAspect(aspectRatio: number): ScreenAspectClass {
        if (aspectRatio <= 1.9) return "classic";
        if (aspectRatio <= 2.18) return "long";
        if (aspectRatio <= 2.25) return "tall";
        return "ultra";
    }

    private finiteOr(value: unknown, fallback: number): number {
        const result = Number(value);
        return Number.isFinite(result) ? result : fallback;
    }

    private positiveOr(value: unknown, fallback: number): number {
        const result = this.finiteOr(value, fallback);
        return result > 0 ? result : fallback;
    }

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }
}

/**
 * Generic component that gives a scene's ordinary `safeAreaRoot` GBox the
 * current safe rectangle. UI content remains editor-authored and follows that
 * target through Relation; business controllers never calculate safe geometry.
 */
export class SafeAreaLayout extends Laya.Script {
    public static readonly SAFE_AREA_ROOT_NAME = "safeAreaRoot";
    public static readonly MENU_AVOIDANCE_ROOT_NAME = "menuButtonAvoidanceRoot";
    public static readonly FULL_BLEED_DIM_OVERLAY_NAME = "fullBleedDimOverlay";
    private static readonly MENU_GAP = 12;

    private _safeAreaRoot: Laya.GBox | null = null;
    private _menuAvoidanceRoot: Laya.GWidget | null = null;
    private _dimOverlay: Laya.GBox | null = null;
    private _dimOverlayAlpha = 1;
    private _menuBaseY = 0;

    onAwake(): void {
        this._safeAreaRoot = this.owner.getChildByName(SafeAreaLayout.SAFE_AREA_ROOT_NAME) as Laya.GBox;
        this._menuAvoidanceRoot = this.owner.getChildByName(
            SafeAreaLayout.MENU_AVOIDANCE_ROOT_NAME) as Laya.GWidget;
        this._dimOverlay = this.owner.getChildByName(
            SafeAreaLayout.FULL_BLEED_DIM_OVERLAY_NAME) as Laya.GBox;
        if (this._dimOverlay) {
            this._dimOverlayAlpha = Math.max(0, Math.min(1, this._dimOverlay.alpha));
            // Put opacity in the fill, not on the container, so child labels
            // and controls keep their intended alpha.
            this._dimOverlay.alpha = 1;
        }
        this._menuBaseY = this._menuAvoidanceRoot?.y || 0;
    }

    onEnable(): void {
        ScreenAdapter.instance.onChanged(this, this.applyLayout);
        this.applyLayout(ScreenAdapter.instance.layout);
    }

    onDisable(): void {
        ScreenAdapter.instance.offChanged(this, this.applyLayout);
    }

    onDestroy(): void {
        ScreenAdapter.instance.offChanged(this, this.applyLayout);
        this._safeAreaRoot = null;
        this._menuAvoidanceRoot = null;
        this._dimOverlay = null;
    }

    private applyLayout = (layout: Readonly<ScreenLayoutSnapshot>): void => {
        if (!this._safeAreaRoot) return;
        const rect = layout.safeRect;
        // SafeAreaLayout exclusively owns these four properties. Descendants
        // and siblings may relate to the target, but must not write it back.
        this._safeAreaRoot.pos(rect.x, rect.y);
        this._safeAreaRoot.size(rect.width, rect.height);

        if (this._dimOverlay) {
            this._dimOverlay.graphics.clear();
            this._dimOverlay.graphics.drawRect(
                0, 0, layout.stageWidth, layout.stageHeight,
                `rgba(0, 0, 0, ${this._dimOverlayAlpha})`);
        }

        if (this._menuAvoidanceRoot) {
            const normalTop = rect.y + this._menuBaseY;
            const menuBottom = layout.menuButtonRect
                ? layout.menuButtonRect.y + layout.menuButtonRect.height + SafeAreaLayout.MENU_GAP
                : 0;
            // The special node's vertical axis is component-owned; its horizontal
            // axis may still use Relation (normally Right_Right -> safeAreaRoot).
            this._menuAvoidanceRoot.y = Math.max(normalTop, menuBottom);
        }
    };
}
