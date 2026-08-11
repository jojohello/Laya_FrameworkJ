import { App } from "../App";
import { ActionContext } from "./ActionRuntime";
import { ActionType } from "./ActionInfo";
import { registerAction } from "./ActionRegistry";
import { BaseAction } from "./BaseAction";

interface SoundPlaybackService {
    playSound(url: string): unknown;
}

/** Plays a config-selected short sound through the cross-package audio service. */
export class SoundAction extends BaseAction {
    execute(_context: ActionContext): number {
        const url = this.info.getStringParam(0).trim();
        if (!url) return 0;

        // Logic must use the Start-owned bridge so Web and mini-game playback share
        // the same mute, volume, URL mapping and concurrency policy.
        const musicMgr = App.musicMgr as SoundPlaybackService | null;
        if (musicMgr && typeof musicMgr.playSound === "function") {
            musicMgr.playSound(url);
        }
        return 0;
    }
}

registerAction(ActionType.Sound, SoundAction);
