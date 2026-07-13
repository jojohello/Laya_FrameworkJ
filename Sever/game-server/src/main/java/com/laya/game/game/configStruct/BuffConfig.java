package com.laya.game.game.configStruct;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 * Buff 配置类
 * 自动生成，请勿手动修改
 *
 * <p>对应JSON文件: config/tables/Buff.json</p>
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
public class BuffConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Buff ID
     */
    @JsonProperty("ID")
    private final int ID;

    /**
     * Duration ms
     */
    @JsonProperty("Duration")
    private final int Duration;

    /**
     * Tick interval ms
     */
    @JsonProperty("TickInterval")
    private final int TickInterval;

    /**
     * Max stack
     */
    @JsonProperty("MaxStack")
    private final int MaxStack;

    /**
     * Stack behavior
     */
    @JsonProperty("StackType")
    private final String StackType;

    /**
     * Flat attr add
     */
    @JsonProperty("AttrAdd")
    private final String AttrAdd;

    /**
     * Percent attr add
     */
    @JsonProperty("AttrPercent")
    private final String AttrPercent;

    /**
     * Action script on add
     */
    @JsonProperty("OnAddAction")
    private final String OnAddAction;

    /**
     * Action script on tick
     */
    @JsonProperty("OnTickAction")
    private final String OnTickAction;

    /**
     * Action script on remove
     */
    @JsonProperty("OnRemoveAction")
    private final String OnRemoveAction;

    /**
     * 构造函数（Jackson反序列化使用）
     * <p>String类型使用intern()进行字符串池化，减少内存占用</p>
     */
    @JsonCreator
    public BuffConfig(
            @JsonProperty("ID") int ID,
            @JsonProperty("Duration") int Duration,
            @JsonProperty("TickInterval") int TickInterval,
            @JsonProperty("MaxStack") int MaxStack,
            @JsonProperty("StackType") String StackType,
            @JsonProperty("AttrAdd") String AttrAdd,
            @JsonProperty("AttrPercent") String AttrPercent,
            @JsonProperty("OnAddAction") String OnAddAction,
            @JsonProperty("OnTickAction") String OnTickAction,
            @JsonProperty("OnRemoveAction") String OnRemoveAction) {
        this.ID = ID;
        this.Duration = Duration;
        this.TickInterval = TickInterval;
        this.MaxStack = MaxStack;
        this.StackType = StackType != null ? StackType.intern() : null;
        this.AttrAdd = AttrAdd;
        this.AttrPercent = AttrPercent;
        this.OnAddAction = OnAddAction;
        this.OnTickAction = OnTickAction;
        this.OnRemoveAction = OnRemoveAction;
    }

    public int getID() {
        return ID;
    }

    public int getDuration() {
        return Duration;
    }

    public int getTickInterval() {
        return TickInterval;
    }

    public int getMaxStack() {
        return MaxStack;
    }

    public String getStackType() {
        return StackType;
    }

    public String getAttrAdd() {
        return AttrAdd;
    }

    public String getAttrPercent() {
        return AttrPercent;
    }

    public String getOnAddAction() {
        return OnAddAction;
    }

    public String getOnTickAction() {
        return OnTickAction;
    }

    public String getOnRemoveAction() {
        return OnRemoveAction;
    }

    @Override
    public String toString() {
        return String.format("BuffConfig{ID=%s, Duration=%s, TickInterval=%s, MaxStack=%s, StackType=%s}",
                ID, Duration, TickInterval, MaxStack, StackType);
    }
}
