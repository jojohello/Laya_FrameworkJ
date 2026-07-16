import { DialogMgr } from "../ui/dialog/DialogMgr";
import { PlayerMgr } from "../player/PlayerMgr";
import { SceneMgr } from "../scene/SceneMgr";
import { UIManager } from "../ui/UIManager";
import { GuideConditionSpec } from "./GuideTypes";

interface GuideConditionEvaluator {
    readonly type: string;
    evaluate(params: any): boolean;
}

class PlayerLevelEqualsCondition implements GuideConditionEvaluator {
    readonly type = "playerLevelEquals";
    evaluate(params: any): boolean {
        return (PlayerMgr.instance.data?.level || 0) === Number(params);
    }
}

class PlayerLevelAtLeastCondition implements GuideConditionEvaluator {
    readonly type = "playerLevelAtLeast";
    evaluate(params: any): boolean {
        return (PlayerMgr.instance.data?.level || 0) >= Number(params?.level ?? params);
    }
}

class SceneActiveCondition implements GuideConditionEvaluator {
    readonly type = "sceneActive";
    evaluate(params: any): boolean {
        return SceneMgr.instance.isSceneOpened(Number(params?.sceneId));
    }
}

class UIReadyCondition implements GuideConditionEvaluator {
    readonly type = "uiReady";
    evaluate(params: any): boolean {
        return UIManager.instance.isOpened(String(params?.view || ""));
    }
}

class DialogIdleCondition implements GuideConditionEvaluator {
    readonly type = "dialogIdle";
    evaluate(_params: any): boolean {
        return !DialogMgr.instance.isOpened;
    }
}

export class GuideConditionRegistry {
    private readonly _evaluators = new Map<string, GuideConditionEvaluator>();

    constructor() {
        this.register(new PlayerLevelEqualsCondition());
        this.register(new PlayerLevelAtLeastCondition());
        this.register(new SceneActiveCondition());
        this.register(new UIReadyCondition());
        this.register(new DialogIdleCondition());
    }

    evaluate(type: string, params: any): boolean {
        const evaluator = this._evaluators.get(type);
        if (!evaluator) {
            console.warn(`[Guide] Unknown condition: ${type}`);
            return false;
        }
        return evaluator.evaluate(params);
    }

    evaluateAll(conditions: readonly GuideConditionSpec[] | undefined): boolean {
        if (!conditions?.length) return true;
        return conditions.every(condition => this.evaluate(condition.type, condition.params));
    }

    private register(evaluator: GuideConditionEvaluator): void {
        if (this._evaluators.has(evaluator.type)) {
            throw new Error(`[Guide] Duplicate condition: ${evaluator.type}`);
        }
        this._evaluators.set(evaluator.type, evaluator);
    }
}
