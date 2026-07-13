import { ActionInfo, ActionType } from "./ActionInfo";
import { BaseAction } from "./BaseAction";
import { BuffAction } from "./BuffAction";
import { BulletAction } from "./BulletAction";
import { DamageAction } from "./DamageAction";

export class ActionFactory {
    static parseActions(actionScript: string, withDelay: boolean = true): BaseAction[] {
        if (!actionScript) return [];

        const actions: BaseAction[] = [];
        const parts = actionScript.split("|");
        for (let i = 0; i < parts.length; i++) {
            const action = this.parseSingleAction(parts[i], withDelay, i);
            if (action) {
                actions.push(action);
            }
        }

        actions.sort((a, b) => a.delayMs - b.delayMs);
        return actions;
    }

    static parseSingleAction(actionScript: string, withDelay: boolean = true, index: number = 0): BaseAction | null {
        const raw = actionScript ? actionScript.trim() : "";
        if (!raw) return null;

        const params = raw.split(";").map(item => item.trim());
        let delay = 0;
        let actionType = "";
        let startIndex = 0;

        if (withDelay) {
            delay = Math.max(0, Number(params[0]) || 0);
            actionType = params[1] || "";
            startIndex = 2;
        } else {
            actionType = params[0] || "";
            startIndex = 1;
        }

        const info = new ActionInfo(delay, actionType, params.slice(startIndex), raw, index);
        return this.create(info);
    }

    static create(info: ActionInfo): BaseAction | null {
        let action: BaseAction | null = null;

        switch (info.actionType) {
            case ActionType.Bullet:
                action = new BulletAction();
                break;
            case ActionType.Buff:
                action = new BuffAction();
                break;
            case ActionType.Damage:
            case ActionType.TrueDamage:
            case ActionType.Effect:
                action = new DamageAction();
                break;
            default:
                console.warn(`[ActionFactory] Unknown action type: ${info.actionType}, raw=${info.raw}`);
                return null;
        }

        action.init(info);
        return action;
    }
}
