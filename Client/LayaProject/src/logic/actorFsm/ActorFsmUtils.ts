import { StateMachine } from "./ActorFsm";

export class ActorFsmUtils {
    /**
     * Create an empty shared state machine definition.
     * Register concrete states at module level and reuse the returned instance by actor type.
     */
    static createSharedFsm<TOwner = any>(): StateMachine<any> {
        return new StateMachine<any>();
    }
}
