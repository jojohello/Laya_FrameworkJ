package com.laya.game.game.configStruct;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 * SceneType 配置类
 * 自动生成，请勿手动修改
 *
 * <p>对应JSON文件: config/tables/scenetypes.json</p>
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
public class SceneTypeConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * ��������
     */
    @JsonProperty("ID")
    private final int ID;

    /**
     * 构造函数（Jackson反序列化使用）
     * <p>String类型使用intern()进行字符串池化，减少内存占用</p>
     */
    @JsonCreator
    public SceneTypeConfig(
            @JsonProperty("ID") int ID) {
        this.ID = ID;
    }

    public int getID() {
        return ID;
    }

    @Override
    public String toString() {
        return String.format("SceneTypeConfig{ID=%s}",
                ID);
    }
}
