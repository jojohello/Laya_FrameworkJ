package com.laya.game.game.configStruct;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 * SceneObjConfig 配置类
 * 自动生成，请勿手动修改
 *
 * <p>对应JSON文件: config/tables/SceneObjConfig.json</p>
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
public class SceneObjConfigConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Config ID server needed
     */
    @JsonProperty("ID")
    private final int ID;

    /**
     * Scene object type server needed
     */
    @JsonProperty("objType")
    private final int objType;

    /**
     * Max HP server needed
     */
    @JsonProperty("hp")
    private final int hp;

    /**
     * Move speed server needed
     */
    @JsonProperty("speed")
    private final float speed;

    /**
     * Attack server needed
     */
    @JsonProperty("attack")
    private final Integer attack;

    /**
     * Defense server needed
     */
    @JsonProperty("defense")
    private final Integer defense;

    /**
     * 构造函数（Jackson反序列化使用）
     * <p>String类型使用intern()进行字符串池化，减少内存占用</p>
     */
    @JsonCreator
    public SceneObjConfigConfig(
            @JsonProperty("ID") int ID,
            @JsonProperty("objType") int objType,
            @JsonProperty("hp") int hp,
            @JsonProperty("speed") float speed,
            @JsonProperty("attack") Integer attack,
            @JsonProperty("defense") Integer defense) {
        this.ID = ID;
        this.objType = objType;
        this.hp = hp;
        this.speed = speed;
        this.attack = attack;
        this.defense = defense;
    }

    public int getID() {
        return ID;
    }

    public int getObjType() {
        return objType;
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

    @Override
    public String toString() {
        return String.format("SceneObjConfigConfig{ID=%s, objType=%s, hp=%s, speed=%s, attack=%s}",
                ID, objType, hp, speed, attack);
    }
}
