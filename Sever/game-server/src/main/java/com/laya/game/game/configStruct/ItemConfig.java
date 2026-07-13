package com.laya.game.game.configStruct;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 * Item 配置类
 * 自动生成，请勿手动修改
 *
 * <p>对应JSON文件: config/tables/Item.json</p>
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
public class ItemConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Item ID
     */
    @JsonProperty("ID")
    private final int ID;

    /**
     * Item type
     */
    @JsonProperty("Type")
    private final String Type;

    /**
     * Quality
     */
    @JsonProperty("Quality")
    private final int Quality;

    /**
     * Max stack
     */
    @JsonProperty("MaxStack")
    private final int MaxStack;

    /**
     * Action script when used
     */
    @JsonProperty("UseAction")
    private final String UseAction;

    /**
     * 构造函数（Jackson反序列化使用）
     * <p>String类型使用intern()进行字符串池化，减少内存占用</p>
     */
    @JsonCreator
    public ItemConfig(
            @JsonProperty("ID") int ID,
            @JsonProperty("Type") String Type,
            @JsonProperty("Quality") int Quality,
            @JsonProperty("MaxStack") int MaxStack,
            @JsonProperty("UseAction") String UseAction) {
        this.ID = ID;
        this.Type = Type != null ? Type.intern() : null;
        this.Quality = Quality;
        this.MaxStack = MaxStack;
        this.UseAction = UseAction;
    }

    public int getID() {
        return ID;
    }

    public String getType() {
        return Type;
    }

    public int getQuality() {
        return Quality;
    }

    public int getMaxStack() {
        return MaxStack;
    }

    public String getUseAction() {
        return UseAction;
    }

    @Override
    public String toString() {
        return String.format("ItemConfig{ID=%s, Type=%s, Quality=%s, MaxStack=%s, UseAction=%s}",
                ID, Type, Quality, MaxStack, UseAction);
    }
}
