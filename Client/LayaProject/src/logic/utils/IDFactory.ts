/**
 * ID 工厂 - 生成唯一ID
 * 用于场景对象、网络消息等需要唯一标识的场景
 */
class IDFactory {
    private static GAME_UNIQUE_ID: number = 0;

    /**
     * 获取下一个唯一ID
     * @returns 唯一ID（自增整数）
     */
    public static GetID(): number {
        IDFactory.GAME_UNIQUE_ID++;
        return IDFactory.GAME_UNIQUE_ID;
    }

    /**
     * 重置ID计数器（谨慎使用，仅在特殊场景如测试重置时）
     */
    public static Reset(): void {
        IDFactory.GAME_UNIQUE_ID = 0;
    }

    /**
     * 获取当前ID计数（不递增）
     */
    public static GetCurrentID(): number {
        return IDFactory.GAME_UNIQUE_ID;
    }
}

export default IDFactory;
