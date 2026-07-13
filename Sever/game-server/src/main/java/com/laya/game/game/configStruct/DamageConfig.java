package com.laya.game.game.configStruct;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 * Damage 配置类
 * 自动生成，请勿手动修改
 *
 * <p>对应JSON文件: config/tables/Damage.json</p>
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
public class DamageConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Damage ID
     */
    @JsonProperty("ID")
    private final int ID;

    /**
     * Base damage
     */
    @JsonProperty("BaseDamage")
    private final int BaseDamage;

    /**
     * Attack percent rate
     */
    @JsonProperty("AttackRate")
    private final Integer AttackRate;

    /**
     * Formula ID
     */
    @JsonProperty("FormulaID")
    private final int FormulaID;

    /**
     * Damage type
     */
    @JsonProperty("DamageType")
    private final String DamageType;

    /**
     * Element type
     */
    @JsonProperty("ElementType")
    private final String ElementType;

    /**
     * 构造函数（Jackson反序列化使用）
     * <p>String类型使用intern()进行字符串池化，减少内存占用</p>
     */
    @JsonCreator
    public DamageConfig(
            @JsonProperty("ID") int ID,
            @JsonProperty("BaseDamage") int BaseDamage,
            @JsonProperty("AttackRate") Integer AttackRate,
            @JsonProperty("FormulaID") int FormulaID,
            @JsonProperty("DamageType") String DamageType,
            @JsonProperty("ElementType") String ElementType) {
        this.ID = ID;
        this.BaseDamage = BaseDamage;
        this.AttackRate = AttackRate;
        this.FormulaID = FormulaID;
        this.DamageType = DamageType != null ? DamageType.intern() : null;
        this.ElementType = ElementType != null ? ElementType.intern() : null;
    }

    public int getID() {
        return ID;
    }

    public int getBaseDamage() {
        return BaseDamage;
    }

    public Integer getAttackRate() {
        return AttackRate;
    }

    public int getFormulaID() {
        return FormulaID;
    }

    public String getDamageType() {
        return DamageType;
    }

    public String getElementType() {
        return ElementType;
    }

    @Override
    public String toString() {
        return String.format("DamageConfig{ID=%s, BaseDamage=%s, AttackRate=%s, FormulaID=%s, DamageType=%s}",
                ID, BaseDamage, AttackRate, FormulaID, DamageType);
    }
}
