import { ConfigMgr } from "../config/ConfigMgr";
import { CreatureSceneObj } from "./CreatureSceneObj";
import { CharacterConfigInfo } from "./CharacterConfigInfo";
import { CharacterTeamColorMaterial } from "./CharacterTeamColorMaterial";
import { BaseScene } from "../scene/BaseScene";
import { CharacterAnimationConfigInfo } from "./CharacterAnimationConfigInfo";
import { FrameAnimationAction, ResFrameAnimation } from "../resource/ResFrameAnimation";
import { ResourceMgr } from "../resource/ResourceMgr";
import { CharacterActorFsm, CharacterStateName, CharacterStateNameValue } from "../actorFsm/CharacterActorFsm";
import { CharacterAIRuntime, SimpleCombatAIAgent } from "../ai/SimpleCombatAI";

const { regClass } = Laya;

export type CharacterAnimName = string;

const DEFAULT_TEAM_COLOR: readonly [number, number, number] = [255, 0, 0];
const TEAM_COLORS: Readonly<Record<number, readonly [number, number, number]>> = {
    1: [45, 110, 235],
    2: [220, 50, 55],
};

/** Battle character display adapter backed by atlas frame animation. */
@regClass()
export class CharacterSceneObj extends CreatureSceneObj {
    fsmStateName?: string;
    aiRuntime?: CharacterAIRuntime;
    private _animName: CharacterAnimName = "idle";
    private _teamMaterial: Laya.Material | null = null;
    private _frameAnimation: ResFrameAnimation | null = null;
    private readonly _animationDurationMap = new Map<string, number>();
    private _animationLoadToken = 0;
    private _animStartTime = 0;
    private _animLoop = true;
    private _teamColor: [number, number, number] = [...DEFAULT_TEAM_COLOR];
    private _runTargetX = 0;
    private _runTargetY = 0;
    private _runStopDistance = 1;
    private _lastRunUpdateTime = 0;
    private _hasRunTarget = false;
    private _skillIds: number[] = [];

    protected onInit(uid: number, cfgId: number, scene: BaseScene, team: number, x: number, y: number, angle: number): void {
        super.onInit(uid, cfgId, scene, team, x, y, angle);
        this._teamColor = [...(TEAM_COLORS[team] || DEFAULT_TEAM_COLOR)];
        const config = ConfigMgr.instance.getConfig<CharacterConfigInfo>("Character", cfgId);
        this._skillIds = this.parseSkillIds(config?.skillIds || "");
        SimpleCombatAIAgent.reset(this);
        CharacterActorFsm.reset(this);
        CharacterActorFsm.setState(CharacterStateName.Idle, this, scene.curTime);
    }

    protected onLogicUpdate(_logicDt: number, curTime: number, _tick: number): void {
        CharacterActorFsm.update(this, curTime);
        this._frameAnimation?.update(curTime);
    }

    protected loadRes(): void {
        const model = this.createModelContainer();
        model.graphics.clear();
        model.filters = [];
        this.releaseFrameAnimation();
        this.releaseTeamMaterial();

        const config = ConfigMgr.instance.getConfig<CharacterConfigInfo>("Character", this._cfgId);
        if (!config) {
            console.error(`[CharacterSceneObj] Character config is missing: cfgId=${this._cfgId}`);
            return;
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

    playAnim(
        name: CharacterAnimName,
        startTime: number,
        loop?: boolean,
        force: boolean = false,
        curTime: number = startTime
    ): number {
        this._animName = name;
        this._animStartTime = startTime;
        this._animLoop = loop ?? false;
        const duration = this._frameAnimation?.play(name, startTime, curTime, this._animLoop, force) ?? -1;
        return duration >= 0 ? duration : (this._animationDurationMap.get(name) ?? -1);
    }

    /** AnimationAction entry; the action name is entirely config-driven. */
    playActionAnimation(name: string, startTime: number, curTime: number): number {
        return Math.max(0, this.playAnim(name, startTime, false, true, curTime));
    }

    get animName(): CharacterAnimName {
        return this._animName;
    }

    changeState(stateName: CharacterStateNameValue, curTime: number, force: boolean = false): void {
        CharacterActorFsm.setState(stateName, this, curTime, force);
    }

    get stateName(): string {
        return CharacterActorFsm.getCurStateName(this);
    }

    /** Run toward a world position using the entity's configured speed. */
    runTo(x: number, y: number, curTime: number, stopDistance: number = 1): boolean {
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
            this.changeState(CharacterStateName.Idle, curTime);
            return true;
        }

        this.changeState(CharacterStateName.Run, curTime);
        return true;
    }

    /** Cast a skill and enter Attack only when the cast request succeeds. */
    attack(
        skillId: number,
        curTime: number,
        targetId: number = 0,
        targetX: number = this.x,
        targetY: number = this.y,
        skillLevel: number = 1
    ): boolean {
        if (this.isRelease || this.isDead) return false;
        const success = this.castSkill(skillId, curTime, targetId, targetX, targetY, skillLevel);
        if (!success) return false;

        this._hasRunTarget = false;
        this.changeState(CharacterStateName.Attack, curTime, true);
        return true;
    }

    /** Called by StateRun; external systems should use runTo(). */
    beginRunState(curTime: number): void {
        this._lastRunUpdateTime = curTime;
    }

    /** Called by StateRun; external systems should use runTo(). */
    updateRunState(curTime: number): void {
        if (!this._hasRunTarget) {
            this.changeState(CharacterStateName.Idle, curTime);
            return;
        }

        const dx = this._runTargetX - this.x;
        const dy = this._runTargetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= this._runStopDistance) {
            this._hasRunTarget = false;
            this.changeState(CharacterStateName.Idle, curTime);
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
            this.changeState(CharacterStateName.Idle, curTime);
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
        return this.isSkillExecuting();
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

    reset(curTime: number): void {
        super.reset(curTime);
        this._animName = "idle";
        CharacterActorFsm.reset(this);
        this._teamColor = [...DEFAULT_TEAM_COLOR];
        this._runTargetX = 0;
        this._runTargetY = 0;
        this._runStopDistance = 1;
        this._lastRunUpdateTime = 0;
        this._hasRunTarget = false;
        this._skillIds.length = 0;
        this._animationDurationMap.clear();
        this._animStartTime = 0;
        this._animLoop = true;
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
    }

    private releaseTeamMaterial(): void {
        if (this._frameAnimation?.animation) this._frameAnimation.animation.material = null;
        this._teamMaterial?.destroy();
        this._teamMaterial = null;
    }

    private applyTeamColorToMaterial(): void {
        if (!this._teamMaterial) return;
        CharacterTeamColorMaterial.setTeamColor(this._teamMaterial, ...this._teamColor);
    }

    private async loadFrameAnimation(model: Laya.Sprite, characterId: number, token: number): Promise<void> {
        const configs = ConfigMgr.instance.getByField<CharacterAnimationConfigInfo>(
            "CharacterAnimation",
            "characterId",
            characterId
        );
        if (configs.length === 0) {
            console.error(`[CharacterSceneObj] Frame animation config is missing: cfgId=${characterId}`);
            return;
        }

        const atlasPath = configs[0].atlasPath;
        const animationFrameRoot = this.getAnimationFrameRoot(atlasPath);
        const maxFrameIndex = Math.max(...configs.map(config => config.endFrameIndex));
        const frameUrls = new Array<string>(maxFrameIndex + 1).fill("");
        const maskFrameUrls = new Array<string>(maxFrameIndex + 1).fill("");
        const actions: FrameAnimationAction[] = [];
        this._animationDurationMap.clear();

        for (const config of configs) {
            if (
                config.atlasPath !== atlasPath ||
                !/^[A-Za-z0-9_-]+$/.test(config.actionName) ||
                !Number.isInteger(config.startFrameIndex) ||
                !Number.isInteger(config.endFrameIndex) ||
                config.startFrameIndex < 0 ||
                config.endFrameIndex < config.startFrameIndex ||
                config.durationMs <= 0
            ) {
                console.error(`[CharacterSceneObj] Invalid frame animation config: cfgId=${characterId}, action=${config.actionName}`);
                this._animationDurationMap.clear();
                return;
            }

            for (
                let frameIndex = config.startFrameIndex;
                frameIndex <= config.endFrameIndex;
                frameIndex++
            ) {
                if (frameUrls[frameIndex]) {
                    console.error(`[CharacterSceneObj] Overlapping frame animation range: cfgId=${characterId}, index=${frameIndex}`);
                    this._animationDurationMap.clear();
                    return;
                }
                const localIndex = frameIndex - config.startFrameIndex;
                const indexText = String(localIndex).padStart(2, "0");
                frameUrls[frameIndex] = `${animationFrameRoot}${config.actionName}_${indexText}.png`;
                maskFrameUrls[frameIndex] = `${animationFrameRoot}${config.actionName}_mask_${indexText}.png`;
            }

            const duration = config.durationMs / 1000;
            this._animationDurationMap.set(
                config.actionName,
                duration
            );
            actions.push({
                name: config.actionName,
                startFrameIndex: config.startFrameIndex,
                endFrameIndex: config.endFrameIndex,
                duration,
            });
        }
        const resource = await ResourceMgr.instance.load(atlasPath, ResFrameAnimation);
        if (token !== this._animationLoadToken || this.model !== model) {
            ResourceMgr.instance.recoverRes(resource);
            return;
        }

        if (!resource.configure(actions, frameUrls, maskFrameUrls)) {
            ResourceMgr.instance.recoverRes(resource);
            return;
        }
        resource.pos(-64, -160);
        resource.setParent(model);
        this._frameAnimation = resource;

        const initial = actions.find(action => action.name === this._animName) || actions[0];
        const baseTexture = Laya.loader.getRes(frameUrls[initial.startFrameIndex]) as Laya.Texture;
        const maskTexture = Laya.loader.getRes(maskFrameUrls[initial.startFrameIndex]) as Laya.Texture;
        if (baseTexture && maskTexture) {
            this.releaseTeamMaterial();
            this._teamMaterial = CharacterTeamColorMaterial.create(baseTexture, maskTexture, this.team);
            if (this._teamMaterial && resource.animation) {
                resource.animation.material = this._teamMaterial;
                this.applyTeamColorToMaterial();
                resource.setFrameChangedHandler((base, mask) => {
                    if (resource.animation && resource.animation.material !== this._teamMaterial) {
                        resource.animation.material = this._teamMaterial;
                    }
                    if (this._teamMaterial && mask) {
                        CharacterTeamColorMaterial.setFrameTextures(this._teamMaterial, base, mask);
                    }
                });
            }
        }
        const curTime = this.scene?.curTime ?? this._animStartTime;
        if (resource.play(this._animName, this._animStartTime, curTime, this._animLoop) >= 0) {
            return;
        }
        console.error(`[CharacterSceneObj] Failed to play frame animation: cfgId=${characterId}, action=${this._animName}`);
        this.releaseTeamMaterial();
        this.releaseFrameAnimation();
    }

    private getAnimationFrameRoot(atlasPath: string): string {
        const separatorIndex = atlasPath.lastIndexOf("/");
        const atlasDirectory = separatorIndex >= 0 ? atlasPath.slice(0, separatorIndex + 1) : "";
        return `${atlasDirectory}animation/`;
    }

    private parseSkillIds(value: string): number[] {
        return value.split(/[;,|]/)
            .map(item => Number(item.trim()))
            .filter(skillId => Number.isInteger(skillId) && skillId > 0);
    }

    protected onSkillExecutionFinished(_skillId: number, curTime: number): void {
        if (this.stateName === CharacterStateName.Attack) {
            this.changeState(CharacterStateName.Idle, curTime);
        }
    }

    private releaseFrameAnimation(): void {
        ++this._animationLoadToken;
        if (this._frameAnimation) {
            ResourceMgr.instance.recoverRes(this._frameAnimation);
            this._frameAnimation = null;
        }
    }
}
