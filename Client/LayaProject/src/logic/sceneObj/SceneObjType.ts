/**
 * 场景对象类型枚举
 * 用于区分场景内不同类型的对象
 */
export enum SceneObjType {
    /** 塔 */
    Tower = 1,

    /** 怪物 */
    Monster = 2,

    /** 子弹 */
    Bullet = 3,

    /** 特效 */
    Effect = 4,

    /** 怪物生成器 */
    MonsterCreater = 5,

    /** 玩家 */
    Player = 6,

    /** NPC */
    NPC = 7,

    /** 道具 */
    Item = 8,
}
