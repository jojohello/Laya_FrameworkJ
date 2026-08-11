import { ActionInfo } from "./ActionInfo";
import { BaseAction } from "./BaseAction";
import { createRegisteredAction } from "./ActionRegistry";

// Import action modules for their self-registration side effects. The factory
// intentionally does not import or branch on concrete action classes.
import "./AnimationAction";
import "./BulletAction";
import "./BuffAction";
import "./DamageAction";
import "./HealAction";
import "./SoundAction";

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

        actions.sort((a, b) => a.delaySeconds - b.delaySeconds);
        return actions;
    }

    static parseSingleAction(actionScript: string, withDelay: boolean = true, index: number = 0): BaseAction | null {
        const raw = actionScript ? actionScript.trim() : "";
        if (!raw) return null;

        const params = raw.split(";").map(item => item.trim());
        let delaySeconds = 0;
        let actionType = "";
        let startIndex = 0;

        if (withDelay) {
            const delayMs = Number(params[0]);
            delaySeconds = Number.isFinite(delayMs) ? Math.max(0, delayMs) / 1000 : 0;
            actionType = params[1] || "";
            startIndex = 2;
        } else {
            actionType = params[0] || "";
            startIndex = 1;
        }

        const info = new ActionInfo(delaySeconds, actionType, params.slice(startIndex), raw, index);
        return this.create(info);
    }

    static create(info: ActionInfo): BaseAction | null {
        const action = createRegisteredAction(info);
        if (!action) {
            console.warn(`[ActionFactory] Unknown action type: ${info.actionType}, raw=${info.raw}`);
        }
        return action;
    }
}
