// jojohello 2023-7-6 action全局一份就可以了，用这个类缓存action，也将action的初始化分散化

import { CfgMgr } from "../config/CfgMgr";
import ActionUtils from "./ActionUtils";
import { BaseAction } from "./BaseAction";

export default class ActionFinder {

    private static findActions(actionMap:Map<number, BaseAction[]>, id:number, tableName:string, title:string, withDelay:boolean):BaseAction[]{
        if(actionMap.has(id)){
            return actionMap.get(id);
        }
        
        let actionStr = CfgMgr.inst.getCfg(tableName, id)[title];
        if(!actionStr){
            console.error("actionStr not found:", actionStr," from id:", id);
            return null;
        }

        let ret = ActionUtils.parseActions(actionStr, withDelay);
        actionMap.set(id, ret);
        return ret;
    }
}