export type GuideCommand = (params?: any) => void | Promise<void>;

export class GuideCommandRegistry {
    private static _instance: GuideCommandRegistry;
    static get instance(): GuideCommandRegistry {
        if (!this._instance) this._instance = new GuideCommandRegistry();
        return this._instance;
    }

    private readonly _commands = new Map<string, GuideCommand>();
    private constructor() {}

    register(key: string, command: GuideCommand): void {
        if (!key || !command) throw new Error("[Guide] Invalid command registration");
        this._commands.set(key, command);
    }

    async execute(key: string, params?: any): Promise<void> {
        const command = this._commands.get(key);
        if (!command) throw new Error(`[Guide] Command is not registered: ${key}`);
        await command(params);
    }

    clear(): void {
        this._commands.clear();
    }
}
