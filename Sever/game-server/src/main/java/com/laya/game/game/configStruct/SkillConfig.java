package com.laya.game.game.configStruct;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 * Skill 配置类
 * 自动生成，请勿手动修改
 *
 * <p>对应JSON文件: config/tables/Skill.json</p>
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
public class SkillConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Composite row ID server needed
     */
    @JsonProperty("ID")
    private final int ID;

    /**
     * Skill ID server needed
     */
    @JsonProperty("SkillID")
    private final int SkillID;

    /**
     * Skill level server needed
     */
    @JsonProperty("Level")
    private final int Level;

    /**
     * Max skill level server needed
     */
    @JsonProperty("MaxLevel")
    private final int MaxLevel;

    /**
     * Skill type server needed
     */
    @JsonProperty("SkillType")
    private final String SkillType;

    /**
     * Target type server needed
     */
    @JsonProperty("TargetType")
    private final String TargetType;

    /**
     * Cast range in pixels
     */
    @JsonProperty("CastRange")
    private final int CastRange;

    /**
     * Cooldown ms server needed
     */
    @JsonProperty("CD")
    private final int CD;

    /**
     * Cost type server needed
     */
    @JsonProperty("CostType")
    private final String CostType;

    /**
     * Cost value server needed
     */
    @JsonProperty("CostValue")
    private final int CostValue;

    /**
     * Action script server needed
     */
    @JsonProperty("Action")
    private final String Action;

    /**
     * 构造函数（Jackson反序列化使用）
     * <p>String类型使用intern()进行字符串池化，减少内存占用</p>
     */
    @JsonCreator
    public SkillConfig(
            @JsonProperty("ID") int ID,
            @JsonProperty("SkillID") int SkillID,
            @JsonProperty("Level") int Level,
            @JsonProperty("MaxLevel") int MaxLevel,
            @JsonProperty("SkillType") String SkillType,
            @JsonProperty("TargetType") String TargetType,
            @JsonProperty("CastRange") int CastRange,
            @JsonProperty("CD") int CD,
            @JsonProperty("CostType") String CostType,
            @JsonProperty("CostValue") int CostValue,
            @JsonProperty("Action") String Action) {
        this.ID = ID;
        this.SkillID = SkillID;
        this.Level = Level;
        this.MaxLevel = MaxLevel;
        this.SkillType = SkillType != null ? SkillType.intern() : null;
        this.TargetType = TargetType != null ? TargetType.intern() : null;
        this.CastRange = CastRange;
        this.CD = CD;
        this.CostType = CostType != null ? CostType.intern() : null;
        this.CostValue = CostValue;
        this.Action = Action;
    }

    public int getID() {
        return ID;
    }

    public int getSkillID() {
        return SkillID;
    }

    public int getLevel() {
        return Level;
    }

    public int getMaxLevel() {
        return MaxLevel;
    }

    public String getSkillType() {
        return SkillType;
    }

    public String getTargetType() {
        return TargetType;
    }

    public int getCastRange() {
        return CastRange;
    }

    public int getCD() {
        return CD;
    }

    public String getCostType() {
        return CostType;
    }

    public int getCostValue() {
        return CostValue;
    }

    public String getAction() {
        return Action;
    }

    @Override
    public String toString() {
        return String.format("SkillConfig{ID=%s, SkillID=%s, Level=%s, MaxLevel=%s, SkillType=%s}",
                ID, SkillID, Level, MaxLevel, SkillType);
    }
}
