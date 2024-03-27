import { StateMachine } from "./ActorFsm";
import StateAttack from "./StateAttack";
import StateDead from "./StateDead";
import StateIdle from "./StateIdle";
import StateMove from "./StateMove";

 export default class ActorFsmUtils {
    public static createMonsterFsm():StateMachine {
        let ret = new StateMachine();
        ret.registerState(new StateIdle());
        ret.registerState(new StateMove());
        ret.registerState(new StateAttack());
        ret.registerState(new StateDead());

        return ret;
    }
}