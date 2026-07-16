import { TopPrefabBase } from "./TopPrefab.generated";

const { regClass } = Laya;

/**
 * 主界面顶部玩家信息 Prefab。
 *
 * playerProfile.lh 通过 runtime UUID 绑定本类。外部界面只传入玩家数据，
 * 不应再直接负责玩家名、等级等 Prefab 内部节点的显示细节。
 */
@regClass()
export class TopPrefab extends TopPrefabBase {
    setPlayerIdentity(name: string | null | undefined, level: number | null | undefined): void {
        this.playerName.text = name?.trim() || "Player";
        this.playerLevel.text = `${Math.max(1, Math.floor(Number(level) || 1))}`;
    }
}
