type EventHandler = (...args: any[]) => void;

export class EventEmitter {

    private static _instance: EventEmitter;
    public static get inst(): EventEmitter {
        if (!EventEmitter._instance) {
            EventEmitter._instance = new EventEmitter();
        }

        return EventEmitter._instance;
    }

    private events: Map<number, EventHandler[]> = new Map();

    on(eventName: number, handler: EventHandler): void {
        const handlers = this.events.get(eventName) || [];
        handlers.push(handler);
        this.events.set(eventName, handlers);
    }

    off(eventName: number, handler: EventHandler): void {
        const handlers = this.events.get(eventName) || [];
        const index = handlers.indexOf(handler);
        if (index !== -1) {
        handlers.splice(index, 1);
        this.events.set(eventName, handlers);
        }
    }

    emit(eventName: number, ...args: any[]): void {
        const handlers = this.events.get(eventName) || [];
        handlers.forEach(handler => handler(...args));
    }
}

Laya["EventEmitter"] = EventEmitter;