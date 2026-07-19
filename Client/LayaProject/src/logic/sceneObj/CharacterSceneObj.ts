import { ConfigMgr } from "../config/ConfigMgr";
import { CreatureSceneObj } from "./CreatureSceneObj";
import { CharacterConfigInfo } from "./CharacterConfigInfo";
import { CharacterTeamColorMaterial } from "./CharacterTeamColorMaterial";
import { BaseScene } from "../scene/BaseScene";
import { CharacterAnimationConfigInfo } from "./CharacterAnimationConfigInfo";
import { FrameAnimationAction, ResFrameAnimation } from "../resource/ResFrameAnimation";
import { ResourceMgr } from "../resource/ResourceMgr";

const { regClass } = Laya;

export type CharacterAnimName = "idle" | "walk" | "attack";

/**
 * Battle character display adapter.
 * The first production pass uses one idle texture while keeping stable action names
 * so frame animation can replace the static renderer without changing battle code.
 */
@regClass()
export class CharacterSceneObj extends CreatureSceneObj {
    private _animName: CharacterAnimName = "idle";
    private _baseLayer: Laya.Sprite | null = null;
    private _teamMaterial: Laya.Material | null = null;
    private _frameAnimation: ResFrameAnimation | null = null;
    private _animationLoadToken = 0;
    private _teamColor: [number, number, number] = [255, 0, 0];

    protected loadRes(): void {
        const model = this.createModelContainer();
        model.graphics.clear();
        model.filters = [];
        this.releaseFrameAnimation();

        this.ensureRenderLayers(model);
        this._baseLayer!.graphics.clear();
        this.releaseTeamMaterial();

        const config = ConfigMgr.instance.getConfig<CharacterConfigInfo>("Character", this._cfgId);
        const texture = config?.modelPath
            ? Laya.loader.getRes(config.modelPath) as Laya.Texture
            : null;
        if (!texture) {
            console.error(`[CharacterSceneObj] Character texture is not loaded: cfgId=${this._cfgId}, path=${config?.modelPath || ""}`);
            return;
        }

        // Logical position is the unit's foot point, not the bitmap center.
        this._baseLayer!.graphics.drawTexture(texture, -texture.width * 0.5, -texture.height);
        const mask = config.teamMaskPath
            ? Laya.loader.getRes(config.teamMaskPath) as Laya.Texture
            : null;
        if (mask) {
            this._teamMaterial = CharacterTeamColorMaterial.create(texture, mask);
            this._baseLayer!.material = this._teamMaterial;
        } else {
            this._baseLayer!.material = null;
            console.warn(`[CharacterSceneObj] Team mask is not loaded: cfgId=${this._cfgId}, path=${config.teamMaskPath || ""}`);
        }
        const scale = config.modelScale > 0 ? config.modelScale : 1;
        model.scale(scale, scale);
        this.playAnim("idle");
        void this.loadFrameAnimation(model, config.ID, ++this._animationLoadToken);
    }

    setTeamColor(r: number, g: number, b: number): void {
        this._teamColor = [r, g, b];
        if (!this._teamMaterial) return;
        CharacterTeamColorMaterial.setTeamColor(this._teamMaterial, r, g, b);
    }

    private ensureRenderLayers(model: Laya.Sprite): void {
        if (!this._baseLayer) {
            this._baseLayer = new Laya.Sprite();
            this._baseLayer.name = "CharacterBaseLayer";
        }
        if (this._baseLayer.parent !== model) model.addChild(this._baseLayer);
    }

    playAnim(name: CharacterAnimName = "idle", loop?: boolean): void {
        this._animName = name;
        this._frameAnimation?.play(name, loop);
    }

    get animName(): CharacterAnimName {
        return this._animName;
    }

    reset(): void {
        super.reset();
        this._animName = "idle";
        this._teamColor = [255, 0, 0];
        this.releaseFrameAnimation();
        if (this.model) {
            this.model.filters = [];
            this.model.scale(1, 1);
        }
        this.releaseTeamMaterial();
    }

    onDispose(scene: BaseScene): void {
        this.releaseTeamMaterial();
        this.releaseFrameAnimation();
        super.onDispose(scene);
        this._baseLayer = null;
    }

    private releaseTeamMaterial(): void {
        if (this._baseLayer) this._baseLayer.material = null;
        if (this._frameAnimation?.animation) this._frameAnimation.animation.material = null;
        this._teamMaterial?.destroy();
        this._teamMaterial = null;
    }

    private async loadFrameAnimation(model: Laya.Sprite, characterId: number, token: number): Promise<void> {
        const configs = ConfigMgr.instance.getByField<CharacterAnimationConfigInfo>(
            "CharacterAnimation",
            "characterId",
            characterId
        );
        if (configs.length === 0) return;

        const atlasPath = configs[0].atlasPath;
        const resource = await ResourceMgr.instance.load(atlasPath, ResFrameAnimation);
        if (token !== this._animationLoadToken || this.model !== model) {
            ResourceMgr.instance.recoverRes(resource);
            return;
        }

        const actions: FrameAnimationAction[] = configs.map(config => ({
            name: config.action,
            frameUrls: this.makeFrameUrls(config.framePrefix, config.frameCount),
            maskFrameUrls: this.makeFrameUrls(config.maskFramePrefix, config.frameCount),
            interval: config.interval,
            loop: config.loop,
            nextAction: config.nextAction || undefined,
        }));
        resource.configure(actions);
        resource.pos(-64, -160);
        resource.setParent(model);
        this._frameAnimation = resource;

        const initial = actions.find(action => action.name === this._animName) || actions[0];
        const baseTexture = Laya.loader.getRes(initial.frameUrls[0]) as Laya.Texture;
        const maskTexture = Laya.loader.getRes(initial.maskFrameUrls[0]) as Laya.Texture;
        if (baseTexture && maskTexture) {
            this.releaseTeamMaterial();
            this._teamMaterial = CharacterTeamColorMaterial.create(baseTexture, maskTexture);
            if (this._teamMaterial && resource.animation) {
                resource.animation.material = this._teamMaterial;
                CharacterTeamColorMaterial.setTeamColor(this._teamMaterial, ...this._teamColor);
                resource.setFrameChangedHandler((base, mask) => {
                    if (this._teamMaterial && mask) {
                        CharacterTeamColorMaterial.setFrameTextures(this._teamMaterial, base, mask);
                    }
                });
            }
        }
        if (resource.play(this._animName)) {
            this._baseLayer!.visible = false;
        } else {
            console.error(`[CharacterSceneObj] Failed to play frame animation: cfgId=${characterId}, action=${this._animName}`);
            this.releaseTeamMaterial();
            this.releaseFrameAnimation();
        }
    }

    private makeFrameUrls(prefix: string, count: number): string[] {
        return Array.from({ length: count }, (_, index) => `${prefix}${String(index).padStart(2, "0")}.png`);
    }

    private releaseFrameAnimation(): void {
        ++this._animationLoadToken;
        if (this._frameAnimation) {
            ResourceMgr.instance.recoverRes(this._frameAnimation);
            this._frameAnimation = null;
        }
        if (this._baseLayer) this._baseLayer.visible = true;
    }
}
