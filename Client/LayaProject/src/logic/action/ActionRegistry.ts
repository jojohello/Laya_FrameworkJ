import { ActionInfo } from "./ActionInfo";
import { BaseAction } from "./BaseAction";

export type ActionConstructor = new () => BaseAction;

const _constructors = new Map<string, ActionConstructor>();

/**
 * Runtime registry for action implementations.
 *
 * Action modules register themselves next to their class definition. The
 * factory only depends on this registry and does not need to know the
 * concrete action subclasses.
 */
export function registerAction(
    actionTypes: string | readonly string[],
    actionConstructor: ActionConstructor
): void {
    const types = typeof actionTypes === "string" ? [actionTypes] : actionTypes;
    for (const actionType of types) {
        if (!actionType) {
            return;
        }

        const previous = _constructors.get(actionType);
        if (previous && previous !== actionConstructor) {
            console.warn(`[ActionRegistry] Replacing action type registration: ${actionType}`);
        }
        _constructors.set(actionType, actionConstructor);
    }
}

export function createRegisteredAction(info: ActionInfo): BaseAction | null {
    const actionConstructor = _constructors.get(info.actionType);
    if (!actionConstructor) {
        return null;
    }

    const action = new actionConstructor();
    action.init(info);
    return action;
}
