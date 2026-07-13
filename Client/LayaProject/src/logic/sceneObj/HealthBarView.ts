export interface HealthBarViewOptions {
    width?: number;
    height?: number;
    prefabUrl?: string;
    bgUrl?: string;
    barUrl?: string;
    bgColor?: string;
    barColor?: string;
}

/**
 * Scene-space health bar.
 * It uses texture resources when available and keeps a graphics fallback for tests.
 */
export class HealthBarView extends Laya.Sprite {
    private _bg: Laya.Sprite;
    private _bar: Laya.Sprite;
    private _prefabRoot: Laya.Sprite | null = null;
    private _hpProgress: Laya.GProgressBar | null = null;
    private _mpProgress: Laya.GProgressBar | null = null;
    private _title: Laya.GTextField | null = null;
    private _widthValue: number;
    private _heightValue: number;
    private _progress: number = 1;
    private _mpProgressValue: number = 1;
    private _titleText: string = "";
    private _prefabUrl: string;
    private _bgUrl: string;
    private _barUrl: string;
    private _bgColor: string;
    private _barColor: string;
    private _usingPrefab: boolean = false;
    private _loadToken: number = 0;

    constructor(options: HealthBarViewOptions = {}) {
        super();
        this._widthValue = options.width ?? 54;
        this._heightValue = options.height ?? 8;
        this._prefabUrl = options.prefabUrl ?? "ui/battlescene/HealthBar.lh";
        this._bgUrl = options.bgUrl ?? "ui/common/imgs/blood-bg.png";
        this._barUrl = options.barUrl ?? "ui/common/imgs/blood-red.png";
        this._bgColor = options.bgColor ?? "#2b2b2b";
        this._barColor = options.barColor ?? "#d94a4a";
        this.mouseEnabled = false;

        this._bg = new Laya.Sprite();
        this._bar = new Laya.Sprite();
        this.addChild(this._bg);
        this.addChild(this._bar);
        this.loadPrefab();
        this.loadTextures();
        this.redraw();
    }

    setStyle(options: HealthBarViewOptions): void {
        let needLoad = false;
        let needPrefabLoad = false;
        if (options.width !== undefined) this._widthValue = options.width;
        if (options.height !== undefined) this._heightValue = options.height;
        if (options.prefabUrl !== undefined && options.prefabUrl !== this._prefabUrl) {
            this._prefabUrl = options.prefabUrl;
            needPrefabLoad = true;
        }
        if (options.bgColor !== undefined) this._bgColor = options.bgColor;
        if (options.barColor !== undefined) this._barColor = options.barColor;
        if (options.bgUrl !== undefined && options.bgUrl !== this._bgUrl) {
            this._bgUrl = options.bgUrl;
            needLoad = true;
        }
        if (options.barUrl !== undefined && options.barUrl !== this._barUrl) {
            this._barUrl = options.barUrl;
            needLoad = true;
        }

        if (needLoad) {
            this.loadTextures();
        }
        if (needPrefabLoad) {
            this.loadPrefab();
        }
        this.redraw();
    }

    setProgress(value: number): void {
        if (!Number.isFinite(value)) value = 0;
        this._progress = Math.max(0, Math.min(1, value));
        this.redraw();
    }

    setMpProgress(value: number): void {
        if (!Number.isFinite(value)) value = 0;
        this._mpProgressValue = Math.max(0, Math.min(1, value));
        this.redraw();
    }

    setTitle(text: string): void {
        this._titleText = text || "";
        if (this._title) {
            this._title.text = this._titleText;
        }
    }

    setBarColor(color: string): void {
        this._barColor = color;
        this.redraw();
    }

    private loadPrefab(): void {
        if (!this._prefabUrl) return;
        const token = ++this._loadToken;

        Laya.loader.load(this._prefabUrl).then((prefab: Laya.Prefab) => {
            if (this.destroyed || token !== this._loadToken || !prefab) return;

            const root = prefab.create() as Laya.Sprite;
            if (!root) return;

            this.applyPrefabRoot(root);
        }).catch(error => {
            console.warn(`[HealthBarView] load prefab failed: ${this._prefabUrl}`, error);
        });
    }

    private applyPrefabRoot(root: Laya.Sprite): void {
        if (this._prefabRoot) {
            this._prefabRoot.removeSelf();
            this._prefabRoot.destroy();
        }

        this._prefabRoot = root;
        this._usingPrefab = true;
        root.pos(0, 0);
        this.addChild(root);

        this._bg.visible = false;
        this._bar.visible = false;

        const hpBg = root.getChildByName("hp_bg") as Laya.Sprite | null;
        const mpBg = root.getChildByName("mp_bg") as Laya.Sprite | null;
        this._hpProgress = hpBg ? hpBg.getChildByName("hp_process") as Laya.GProgressBar : null;
        this._mpProgress = mpBg
            ? (mpBg.getChildByName("mp_process") || mpBg.getChildByName("hp_process")) as Laya.GProgressBar
            : null;
        this._title = root.getChildByName("title") as Laya.GTextField | null;

        if (!this._hpProgress) {
            console.warn("[HealthBarView] prefab missing hp_bg/hp_process, fallback to graphics bar");
            this._usingPrefab = false;
            root.visible = false;
            this._bg.visible = true;
            this._bar.visible = true;
        }

        this.redraw();
    }

    private loadTextures(): void {
        const urls = [this._bgUrl, this._barUrl].filter(url => !!url);
        if (urls.length === 0) return;

        Laya.loader.load(urls).then(() => {
            if (this.destroyed) return;
            this.redraw();
        });
    }

    private redraw(): void {
        if (this._usingPrefab) {
            if (this._hpProgress) {
                this._hpProgress.min = 0;
                this._hpProgress.max = 1;
                this._hpProgress.value = this._progress;
            }
            if (this._mpProgress) {
                this._mpProgress.min = 0;
                this._mpProgress.max = 1;
                this._mpProgress.value = this._mpProgressValue;
            }
            if (this._title) {
                this._title.text = this._titleText;
            }
            this.pivot(0, 0);
            return;
        }

        const bgTexture = Laya.loader.getRes(this._bgUrl) as Laya.Texture;
        const barTexture = Laya.loader.getRes(this._barUrl) as Laya.Texture;
        const barWidth = this._widthValue * this._progress;

        this._bg.graphics.clear();
        if (bgTexture) {
            this._bg.graphics.drawTexture(bgTexture, 0, 0, this._widthValue, this._heightValue);
        } else {
            this._bg.graphics.drawRect(0, 0, this._widthValue, this._heightValue, this._bgColor);
        }

        this._bar.graphics.clear();
        if (barTexture && barWidth > 0) {
            this._bar.graphics.drawTexture(barTexture, 0, 0, barWidth, this._heightValue);
        } else if (barWidth > 0) {
            this._bar.graphics.drawRect(0, 0, barWidth, this._heightValue, this._barColor);
        }
        this.pivot(this._widthValue * 0.5, this._heightValue * 0.5);
    }
}
