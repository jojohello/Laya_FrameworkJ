package com.laya.game.game.configStruct;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 * Guide 配置类
 * 自动生成，请勿手动修改
 *
 * <p>对应JSON文件: config/tables/Guide.json</p>
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
public class GuideConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 引导ID
     */
    @JsonProperty("ID")
    private final int ID;

    /**
     * 双端激发条件类型
     */
    @JsonProperty("triggerType")
    private final String triggerType;

    /**
     * 激发条件参数
     */
    @JsonProperty("triggerArgs")
    private final String triggerArgs;

    /**
     * 客户端流程ID
     */
    @JsonProperty("flowId")
    private final int flowId;

    /**
     * 优先级
     */
    @JsonProperty("priority")
    private final int priority;

    /**
     * 流程版本
     */
    @JsonProperty("version")
    private final int version;

    /**
     * 是否启用
     */
    @JsonProperty("enabled")
    private final boolean enabled;

    /**
     * 构造函数（Jackson反序列化使用）
     * <p>String类型使用intern()进行字符串池化，减少内存占用</p>
     */
    @JsonCreator
    public GuideConfig(
            @JsonProperty("ID") int ID,
            @JsonProperty("triggerType") String triggerType,
            @JsonProperty("triggerArgs") String triggerArgs,
            @JsonProperty("flowId") int flowId,
            @JsonProperty("priority") int priority,
            @JsonProperty("version") int version,
            @JsonProperty("enabled") boolean enabled) {
        this.ID = ID;
        this.triggerType = triggerType != null ? triggerType.intern() : null;
        this.triggerArgs = triggerArgs;
        this.flowId = flowId;
        this.priority = priority;
        this.version = version;
        this.enabled = enabled;
    }

    public int getID() {
        return ID;
    }

    public String getTriggerType() {
        return triggerType;
    }

    public String getTriggerArgs() {
        return triggerArgs;
    }

    public int getFlowId() {
        return flowId;
    }

    public int getPriority() {
        return priority;
    }

    public int getVersion() {
        return version;
    }

    public boolean getEnabled() {
        return enabled;
    }

    @Override
    public String toString() {
        return String.format("GuideConfig{ID=%s, triggerType=%s, triggerArgs=%s, flowId=%s, priority=%s}",
                ID, triggerType, triggerArgs, flowId, priority);
    }
}
