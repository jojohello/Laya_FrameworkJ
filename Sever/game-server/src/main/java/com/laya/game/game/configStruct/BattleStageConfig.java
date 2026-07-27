package com.laya.game.game.configStruct;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 * BattleStage 配置类
 * 自动生成，请勿手动修改
 *
 * <p>对应JSON文件: config/tables/BattleStage.json</p>
 *
 * <p>性能优化：</p>
 * <ul>
 *   <li>使用 final 保证不可变性，线程安全</li>
 *   <li>String interning 减少内存占用（重复字符串）</li>
 * </ul>
 *
 * @author Laya Development Team (Auto Generated)
 * @since 1.0.0
 */
public class BattleStageConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 关卡ID
     */
    @JsonProperty("ID")
    private final int ID;

    /**
     * 战斗ID
     */
    @JsonProperty("battleId")
    private final int battleId;

    /**
     * 是否可进入
     */
    @JsonProperty("canEnter")
    private final boolean canEnter;

    /**
     * 胜利奖励(itemId:数量;itemId:数量)
     */
    @JsonProperty("victoryRewards")
    private final String victoryRewards;

    /**
     * 构造函数（Jackson反序列化使用）
     * <p>String类型使用intern()进行字符串池化，减少内存占用</p>
     */
    @JsonCreator
    public BattleStageConfig(
            @JsonProperty("ID") int ID,
            @JsonProperty("battleId") int battleId,
            @JsonProperty("canEnter") boolean canEnter,
            @JsonProperty("victoryRewards") String victoryRewards) {
        this.ID = ID;
        this.battleId = battleId;
        this.canEnter = canEnter;
        this.victoryRewards = victoryRewards;
    }

    public int getID() {
        return ID;
    }

    public int getBattleId() {
        return battleId;
    }

    public boolean getCanEnter() {
        return canEnter;
    }

    public String getVictoryRewards() {
        return victoryRewards;
    }

    @Override
    public String toString() {
        return String.format("BattleStageConfig{ID=%s, battleId=%s, canEnter=%s, victoryRewards=%s}",
                ID, battleId, canEnter, victoryRewards);
    }
}
