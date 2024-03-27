

class IDFactory{
    private static GAME_UNIQUE_ID: number = 0;

    public static GetID(): number{
        IDFactory.GAME_UNIQUE_ID++;
        return IDFactory.GAME_UNIQUE_ID;
    }
}

export default IDFactory;