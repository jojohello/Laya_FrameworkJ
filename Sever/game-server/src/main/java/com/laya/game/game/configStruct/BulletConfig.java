package com.laya.game.game.configStruct;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 * Bullet 配置类
 * 自动生成，请勿手动修改
 *
 * <p>对应JSON文件: config/tables/Bullet.json</p>
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
public class BulletConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Bullet ID
     */
    @JsonProperty("ID")
    private final int ID;

    /**
     * Movement type
     */
    @JsonProperty("MoveType")
    private final String MoveType;

    /**
     * Move speed
     */
    @JsonProperty("Speed")
    private final int Speed;

    /**
     * Collision radius
     */
    @JsonProperty("Range")
    private final int Range;

    /**
     * Extra hit count
     */
    @JsonProperty("PenetrateCount")
    private final int PenetrateCount;

    /**
     * Fly time ms
     */
    @JsonProperty("FlyTime")
    private final int FlyTime;

    /**
     * Whether checks collision
     */
    @JsonProperty("CheckCollision")
    private final boolean CheckCollision;

    /**
     * Action script when hit
     */
    @JsonProperty("OnHitAction")
    private final String OnHitAction;

    /**
     * 构造函数（Jackson反序列化使用）
     * <p>String类型使用intern()进行字符串池化，减少内存占用</p>
     */
    @JsonCreator
    public BulletConfig(
            @JsonProperty("ID") int ID,
            @JsonProperty("MoveType") String MoveType,
            @JsonProperty("Speed") int Speed,
            @JsonProperty("Range") int Range,
            @JsonProperty("PenetrateCount") int PenetrateCount,
            @JsonProperty("FlyTime") int FlyTime,
            @JsonProperty("CheckCollision") boolean CheckCollision,
            @JsonProperty("OnHitAction") String OnHitAction) {
        this.ID = ID;
        this.MoveType = MoveType != null ? MoveType.intern() : null;
        this.Speed = Speed;
        this.Range = Range;
        this.PenetrateCount = PenetrateCount;
        this.FlyTime = FlyTime;
        this.CheckCollision = CheckCollision;
        this.OnHitAction = OnHitAction;
    }

    public int getID() {
        return ID;
    }

    public String getMoveType() {
        return MoveType;
    }

    public int getSpeed() {
        return Speed;
    }

    public int getRange() {
        return Range;
    }

    public int getPenetrateCount() {
        return PenetrateCount;
    }

    public int getFlyTime() {
        return FlyTime;
    }

    public boolean getCheckCollision() {
        return CheckCollision;
    }

    public String getOnHitAction() {
        return OnHitAction;
    }

    @Override
    public String toString() {
        return String.format("BulletConfig{ID=%s, MoveType=%s, Speed=%s, Range=%s, PenetrateCount=%s}",
                ID, MoveType, Speed, Range, PenetrateCount);
    }
}
