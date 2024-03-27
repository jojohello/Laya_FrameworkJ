import BulletAction from "./ActionBullet";
import DamageAction from "./ActionDamage";
import ActionTrueDamage from "./ActionTrueDamage";
import { BaseAction } from "./BaseAction";

export default class ActionUtils{
    // 必须先调用这个，不然的话，action没办法根据名字找到对应的类
    public static registerActions(){
        Laya.ClassUtils.regClass("DamageAction", DamageAction);
        Laya.ClassUtils.regClass("BulletAction", BulletAction);
        Laya.ClassUtils.regClass("TrueDamageAction", ActionTrueDamage);
    }

    public static parseActions(paramStr:string, withDelay:boolean = false):BaseAction[]{
        let ret = [];
        let actionStrList = paramStr.split("|");
        for (let i=0; i<actionStrList.length; i++){
            let newAction = ActionUtils.parseSingleAction(actionStrList[i], withDelay);
            if(newAction){
                ret.push(newAction);
            }
        }

        // 根据延迟排序
        ret.sort((a:BaseAction, b:BaseAction)=>{
            return a.delay - b.delay;
        })

        return ret;
    }

    public static parseSingleAction(str:string, withDelay:boolean = false):BaseAction{
        let paramList = str.split(";");
        let delay = 0;
        let actionName = "";
        let startIndex = 0;
        if(withDelay){
            delay = Number(paramList[0]);
            actionName = paramList[1];
            startIndex = 2;
        }else{
            actionName = paramList[0];
            startIndex = 1;
        }
        
        let action = Laya.ClassUtils.getInstance(actionName + "Action");
        if(!action){
            console.error("action not found:", actionName," from paramStr:", str);
            return null;
        }

        action.delay = delay;
        action.parseParams(paramList, startIndex);

        return action;
    }
}