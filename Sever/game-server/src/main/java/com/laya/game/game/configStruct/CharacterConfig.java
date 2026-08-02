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
     * Max HP
     */
    @JsonProperty("hp")
    private final int hp;

    /**
     * Move speed
     */
    @JsonProperty("speed")
    private final float speed;

    /**
     * Unified attack attribute
     */
    @JsonProperty("attack")
    private final Integer attack;

    /**
     * Physical defense
     */
    @JsonProperty("defense")
    private final Integer defense;

    /**
     * Magic defense
     */
    @JsonProperty("magicDefense")
    private final Integer magicDefense;

    /**
     * Logical circular occupancy radius in world units
     */
    @JsonProperty("range")
    private final int range;

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
            @JsonProperty("hp") int hp,
            @JsonProperty("speed") float speed,
            @JsonProperty("attack") Integer attack,
            @JsonProperty("defense") Integer defense,
            @JsonProperty("magicDefense") Integer magicDefense,
            @JsonProperty("range") int range,
            @JsonProperty("skillIds") String skillIds) {
        this.ID = ID;
        this.soldierType = soldierType != null ? soldierType.intern() : null;
        this.hp = hp;
        this.speed = speed;
        this.attack = attack;
        this.defense = defense;
        this.magicDefense = magicDefense;
        this.range = range;
        this.skillIds = skillIds;
    }

    public int getID() {
        return ID;
    }

    public String getSoldierType() {
        return soldierType;
    }

    public int getHp() {
        return hp;
    }

    public float getSpeed() {
        return speed;
    }

    public Integer getAttack() {
        return attack;
    }

    public Integer getDefense() {
        return defense;
    }

    public Integer getMagicDefense() {
        return magicDefense;
    }

    public int getRange() {
        return range;
    }

    public String getSkillIds() {
        return skillIds;
    }

    @Override
    public String toString() {
        return String.format("CharacterConfig{ID=%s, soldierType=%s, hp=%s, speed=%s, attack=%s}",
                ID, soldierType, hp, speed, attack);
    }
}
