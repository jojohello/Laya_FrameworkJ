import { BaseScene } from "../../../../src/logic/scene/BaseScene";
import { SceneLayerNames, SceneLayerType } from "../../../../src/logic/scene/SceneLayerType";
import { BaseSceneObj } from "../../../../src/logic/sceneObj/BaseSceneObj";
import { BulletSceneObj } from "../../../../src/logic/sceneObj/BulletSceneObj";
import { CharacterSceneObj } from "../../../../src/logic/sceneObj/CharacterSceneObj";
import { SceneObjType } from "../../../../src/logic/sceneObj/SceneObjType";
import { ActionInfo } from "../../../../src/logic/action/ActionInfo";
import { ActionContext } from "../../../../src/logic/action/ActionRuntime";
import { BaseAction } from "../../../../src/logic/action/BaseAction";
import { assertHeadless } from "./HeadlessTestRunner";

const TEST_ENTITY_CLASS = "HeadlessTestEntity";
const TEST_BULLET_CLASS = "HeadlessTestBullet";
const TEST_CHARACTER_CLASS = "HeadlessTestCharacter";

export class HeadlessTestEntity extends BaseSceneObj {
    hitCount: number = 0;
    readonly canParticipateInCrowdSeparation = true;

    getObjType(): number { return SceneObjType.Monster; }
    getDamage(_casterId: number, _damage: number, _curTime: number): void { this.hitCount++; }

    protected onInit(): void {
        this.hitCount = 0;
        this.setCollisionBox(20);
    }

    protected canEnterSpatialIndex(): boolean { return true; }
    protected loadRes(): void {}
}

export class HeadlessTestBullet extends BulletSceneObj {
    protected loadRes(): void {}
}

/** Character fixture that exercises the real Run state without loading display resources. */
export class HeadlessTestCharacter extends CharacterSceneObj {
    protected onInit(uid: number, cfgId: number, scene: BaseScene, team: number, x: number, y: number, angle: number): void {
        super.onInit(uid, cfgId, scene, team, x, y, angle);
        this.attrs.setBase("speed", 60);
    }

    protected loadRes(): void {}
}

/** Test-only action that records real SkillAgent/BuffRuntime executions. */
export class HeadlessCountingAction extends BaseAction {
    executionCount: number = 0;

    execute(_context: ActionContext): number {
        this.executionCount++;
        return 0;
    }
}

export function createHeadlessCountingAction(delaySeconds: number = 0): HeadlessCountingAction {
    const action = new HeadlessCountingAction();
    action.init(new ActionInfo(delaySeconds, "HeadlessCounting", [], "HeadlessCounting", 0));
    return action;
}

export class HeadlessTestWorld extends BaseScene {
    private _previousLayerMgr: unknown;

    start(): void {
        this._previousLayerMgr = (Laya.Browser.window as any).LayerMgr;
        const scene = new Laya.Sprite();
        const layers: Record<string, Laya.Sprite> = {};
        for (const layerType of Object.values(SceneLayerType).filter(value => typeof value === "number") as SceneLayerType[]) {
            const layer = new Laya.Sprite();
            scene.addChild(layer);
            layers[SceneLayerNames[layerType]] = layer;
        }
        (Laya.Browser.window as any).LayerMgr = { scene, layers };
        this.setSceneConfig({ mapWidth: 1024, mapHeight: 1024 });
        this.onEnter();
    }

    stop(): void {
        this.onDestroy();
        (Laya.Browser.window as any).LayerMgr = this._previousLayerMgr;
    }

    createEntity(team: number, x: number, y: number): HeadlessTestEntity {
        const entity = this.addObjectToScene(TEST_ENTITY_CLASS, 0, team, x, y, 0) as HeadlessTestEntity | null;
        assertHeadless(entity, "failed to create headless entity");
        return entity;
    }

    createBullet(x: number, y: number, team: number): HeadlessTestBullet {
        const bullet = this.addObjectToScene(TEST_BULLET_CLASS, 0, team, x, y, 0) as HeadlessTestBullet | null;
        assertHeadless(bullet, "failed to create headless bullet");
        return bullet;
    }

    createCharacter(team: number, x: number, y: number): HeadlessTestCharacter {
        const character = this.addObjectToScene(TEST_CHARACTER_CLASS, 0, team, x, y, 0) as HeadlessTestCharacter | null;
        assertHeadless(character, "failed to create headless character");
        return character;
    }

    stepFrames(count: number, deltaSeconds: number = 1 / 30): void {
        for (let index = 0; index < count; index++) this.update(deltaSeconds);
    }
}

export function registerHeadlessTestClasses(): void {
    Laya.ClassUtils.regClass(TEST_ENTITY_CLASS, HeadlessTestEntity);
    Laya.ClassUtils.regClass(TEST_BULLET_CLASS, HeadlessTestBullet);
    Laya.ClassUtils.regClass(TEST_CHARACTER_CLASS, HeadlessTestCharacter);
}
