import { CfgMgr } from "../config/CfgMgr";
import { BaseAction } from "../action/BaseAction";
import ActionUtils from "../action/ActionUtils";


export default class SkillUtils { 
    //delay;ActionName;param1;param2...|delay;ActionName;Param1;Param2..
    private static _skillDefDict:Map<number, number[]> = new Map<number, number[]>();
    private static _isProloaded:boolean = false;
    public static preloadSkillConfig(): void{
        let table = CfgMgr.inst.getTable("Skill");
        
        //let config = null;
        for(const [id, config] of table){
            //config = table[key];

            let baseId = config["BaseID"];
            let level = config["Level"];

            if(!SkillUtils._skillDefDict.has(baseId)){
                SkillUtils._skillDefDict.set(baseId, []);
            }

            let levelList = SkillUtils._skillDefDict.get(baseId);
            if(levelList.length >= level){
                levelList[level - 1] = config["ID"];
            }else{
                for(let i = levelList.length; i < level; i++){
                    if(i == level - 1){
                        levelList.push(config["ID"]);
                    }else{
                        levelList.push(-1);
                    }
                }
            }
        }

        this._isProloaded = true;
    }

    private static prebuildActions(config:any): void{
        if (config["prased"])
            return;

        let actionList = config["Action"];

        config["Action"] = ActionUtils.parseActions(actionList, true);
        config["prased"] = true;
    }

    public static getCfgById(id: number): Map<string,any>{
        let config = CfgMgr.inst.getCfg("Skill", id);
        if(!config){
            return null;
        }

        SkillUtils.prebuildActions(config);
        return config;
    }

    public static getCfgByBaseId(baseId: number, level: number): Map<string,any>{ 
        if(SkillUtils._isProloaded == false){
            SkillUtils.preloadSkillConfig();
        }
        
        //cby_todo config表读取方式待确认
        let skillId = SkillUtils._skillDefDict.get(baseId)[level - 1];
        if(!skillId || skillId == -1){
            return null;
        }

        let config = CfgMgr.inst.getCfg("Skill", skillId);
        SkillUtils.prebuildActions(config);
        return config;
    }
}