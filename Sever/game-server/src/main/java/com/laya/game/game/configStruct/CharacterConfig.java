package com.laya.game.game.configStruct;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 * Character 配置类
 * 自动生成，请勿手动修改
 *
 * <p>对应JSON文件: config/tables/Character.json</p>
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
public class CharacterConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Character config ID
     */
    @JsonProperty("ID")
    private final int ID;

    /**
     * Soldier class
     */
    @JsonProperty("soldierType")
    private final String soldierType;

    /**
     * Base scene object config ID
     */
    @JsonProperty("sceneObjConfigId")
    private final int sceneObjConfigId;

    /**
     * Semicolon separated skill IDs by priority
     */
    @JsonProperty("skillIds")
    private final String skillIds;

    /**
     * 构造函数（Jackson反序列化使用）
     * <p>String类型使用intern()进行字符串池化，减少内存占用</p>
     */
    @JsonCreator
    public CharacterConfig(
            @JsonProperty("ID") int ID,
            @JsonProperty("soldierType") String soldierType,
            @JsonProperty("sceneObjConfigId") int sceneObjConfigId,
            @JsonProperty("skillIds") String skillIds) {
        this.ID = ID;
        this.soldierType = soldierType != null ? soldierType.intern() : null;
        this.sceneObjConfigId = sceneObjConfigId;
        this.skillIds = skillIds;
    }

    public int getID() {
        return ID;
    }

    public String getSoldierType() {
        return soldierType;
    }

    public int getSceneObjConfigId() {
        return sceneObjConfigId;
    }

    public String getSkillIds() {
        return skillIds;
    }

    @Override
    public String toString() {
        return String.format("CharacterConfig{ID=%s, soldierType=%s, sceneObjConfigId=%s, skillIds=%s}",
                ID, soldierType, sceneObjConfigId, skillIds);
    }
}
