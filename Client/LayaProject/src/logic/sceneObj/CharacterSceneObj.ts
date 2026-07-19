import { ConfigMgr } from "../config/ConfigMgr";
import { CreatureSceneObj } from "./CreatureSceneObj";
import { CharacterConfigInfo } from "./CharacterConfigInfo";
import { CharacterTeamColorMaterial } from "./CharacterTeamColorMaterial";
import { BaseScene } from "../scene/BaseScene";
import { CharacterAnimationConfigInfo } from "./CharacterAnimationConfigInfo";
import { FrameAnimationAction, ResFrameAnimation } from "../resource/ResFrameAnimation";
import { ResourceMgr } from "../resource/ResourceMgr";
import { FsmRuntime } from "../actorFsm/ActorFsm";
import { CharacterActorFsm, CharacterStateName, CharacterStateNameValue } from "../actorFsm/CharacterActorFsm";
import { CharacterAIRuntime, SimpleCombatAIAgent } from "../ai/SimpleCombatAI";

const { regClass } = Laya;

export type CharacterAnimName = "idle" | "walk" | "attack";

/**
 * Battle character display adapter.
 * The first production pass uses one idle texture while keeping stable action names
 * so frame animation can replace the static renderer without changing battle code.
 */
@regClass()
export class CharacterSceneObj extends CreatureSceneObj {
    fsmRuntime?: FsmRuntime;
    aiRuntime?: CharacterAIRuntime;
    private _animName: CharacterAnimName = "idle";
    private _baseLayer: Laya.Sprite | null = null;
    private _teamMaterial: Laya.Material | null = null;
    private _frameAnimation: ResFrameAnimation | null = null;
    private _animationLoadToken = 0;
    private _teamColor: [number, number, number] = [255, 0, 0];
    private _runTargetX = 0;
    private _runTargetY = 0;
    private _runStopDistance = 1;
    private _lastRunUpdateTime = 0;
    private _hasRunTarget = false;
    private _skillIds: number[] = [];

    protected onInit(uid: number, cfgId: number, scene: BaseScene, team: number, x: number, y: number, angle: number): void {
        super.onInit(uid, cfgId, scene, team, x, y, angle);
        const config = ConfigMgr.instance.getConfig<CharacterConfigInfo>("Character", cfgId);
        this._skillIds = this.parseSkillIds(config?.skillIds || "");
        SimpleCombatAIAgent.reset(this);
        CharacterActorFsm.reset(this);
        CharacterActorFsm.setState(CharacterStateName.Idle, this);
    }

    protected onUpdate(curTime: number): void {
        CharacterActorFsm.update(this, curTime);
        SimpleCombatAIAgent.update(this, curTime);
    }

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

    playAnim(name: CharacterAnimName = "idle", loop?: boolean, force: boolean = false): void {
        this._animName = name;
        this._frameAnimation?.play(name, loop, force);
    }

    get animName(): CharacterAnimName {
        return this._animName;
    }

    changeState(stateName: CharacterStateNameValue, force: boolean = false): void {
        CharacterActorFsm.setState(stateName, this, force);
    }

    get stateName(): string {
        return CharacterActorFsm.getCurStateName(this);
    }

    /** Run toward a world position using the entity's configured speed. */
    runTo(x: number, y: number, stopDistance: number = 1): boolean {
        if (this.isRelease || this.isDead || !Number.isFinite(x) || !Number.isFinite(y)) return false;
        if (this.attrs.getFinal("speed", 0) <= 0) return false;

        this._runTargetX = x;
        this._runTargetY = y;
        this._runStopDistance = Math.max(0, Number(stopDistance) || 0);
        this._hasRunTarget = true;

        const dx = x - this.x;
        const dy = y - this.y;
        if (dx * dx + dy * dy <= this._runStopDistance * this._runStopDistance) {
            this._hasRunTarget = false;
            this.changeState(CharacterStateName.Idle);
            return true;
        }

        this.changeState(CharacterStateName.Run);
        return true;
    }

    /** Cast a skill and enter Attack only when the cast request succeeds. */
    attack(
        skillId: number,
        targetId: number = 0,
        targetX: number = this.x,
        targetY: number = this.y,
        skillLevel: number = 1
    ): boolean {
        if (this.isRelease || this.isDead) return false;
        const success = this.castSkill(skillId, targetId, targetX, targetY, skillLevel);
        if (!success) return false;

        this._hasRunTarget = false;
        this.changeState(CharacterStateName.Attack, true);
        return true;
    }

    /** Called by StateRun; external systems should use runTo(). */
    beginRunState(): void {
        this._lastRunUpdateTime = this.scene?.curTime ?? 0;
    }

    /** Called by StateRun; external systems should use runTo(). */
    updateRunState(curTime: number): void {
        if (!this._hasRunTarget) {
            this.changeState(CharacterStateName.Idle);
            return;
        }

        const dx = this._runTargetX - this.x;
        const dy = this._runTargetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= this._runStopDistance) {
            this._hasRunTarget = false;
            this.changeState(CharacterStateName.Idle);
            return;
        }

        const deltaTime = Math.max(0, Math.min(0.1, curTime - this._lastRunUpdateTime));
        this._lastRunUpdateTime = curTime;
        if (deltaTime <= 0) return;

        const moveDistance = this.attrs.getFinal("speed", 0) * deltaTime;
        const remainingDistance = Math.max(0, distance - this._runStopDistance);
        if (moveDistance <= 0 || moveDistance >= remainingDistance) {
            this.setPos(
                this.x + dx / distance * remainingDistance,
                this.y + dy / distance * remainingDistance
            );
            this._hasRunTarget = false;
            this.changeState(CharacterStateName.Idle);
            return;
        }

        this.setPos(
            this.x + dx / distance * moveDistance,
            this.y + dy / distance * moveDistance
        );
    }

    /** Called by StateRun when another state interrupts movement. */
    endRunState(): void {
        this._lastRunUpdateTime = 0;
        this._hasRunTarget = false;
    }

    get skillIds(): readonly number[] {
        return this._skillIds;
    }

    get isRunning(): boolean {
        return this.stateName === CharacterStateName.Run;
    }

    get isExecutingSkill(): boolean {
        return this.stateName === CharacterStateName.Attack;
    }

    get isIdle(): boolean {
        return this.stateName === CharacterStateName.Idle;
    }

    hasReachedRunTarget(): boolean {
        if (!this._hasRunTarget) return true;
        const dx = this._runTargetX - this.x;
        const dy = this._runTargetY - this.y;
        return dx * dx + dy * dy <= this._runStopDistance * this._runStopDistance;
    }

    reset(): void {
        super.reset();
        this._animName = "idle";
        CharacterActorFsm.reset(this);
        this._teamColor = [255, 0, 0];
        this._runTargetX = 0;
        this._runTargetY = 0;
        this._runStopDistance = 1;
        this._lastRunUpdateTime = 0;
        this._hasRunTarget = false;
        this._skillIds.length = 0;
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
        resource.setActionCompleteHandler(this.onAnimationActionComplete);
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

    private parseSkillIds(value: string): number[] {
        return value.split(/[;,|]/)
            .map(item => Number(item.trim()))
            .filter(skillId => Number.isInteger(skillId) && skillId > 0);
    }

    private onAnimationActionComplete = (actionName: string): void => {
        if (actionName === "attack" && this.stateName === CharacterStateName.Attack) {
            this.changeState(CharacterStateName.Idle);
        }
    };

    private releaseFrameAnimation(): void {
        ++this._animationLoadToken;
        if (this._frameAnimation) {
            ResourceMgr.instance.recoverRes(this._frameAnimation);
            this._frameAnimation = null;
        }
        if (this._baseLayer) this._baseLayer.visible = true;
    }
}
