/**
 * Logic package protocol base.
 *
 * The logic package must not extend a class from the startup/main package:
 * Laya can load the logic scene bundle independently during HotReload.
 * Runtime services are supplied through the startup bridge on window.
 */
export abstract class LogicProtocol {
    private readonly _registeredHandlers = new Map<number, Function>();

    init(): void {
        this.register();
    }

    protected abstract register(): void;

    protected registerMessage(msgId: number, handler: Function): void {
        if (!msgId || !handler) return;

        this._registeredHandlers.set(msgId, handler);
        const dispatcher = (Laya.Browser.window as any).messageDispatcher;
        dispatcher?.register(msgId, handler);
    }

    protected sendMessage(msgId: number, data?: any, userId?: string): void {
        const networkManager = (Laya.Browser.window as any).networkManager;
        if (!networkManager?.connected) {
            console.warn(`[${this.constructor.name}] network is not connected, msgId=${msgId}`);
            return;
        }

        networkManager.send({ msgId, userId, data });
    }

    release(): void {
        const dispatcher = (Laya.Browser.window as any).messageDispatcher;
        for (const msgId of this._registeredHandlers.keys()) {
            dispatcher?.unregister(msgId);
        }
        this._registeredHandlers.clear();
    }
}
