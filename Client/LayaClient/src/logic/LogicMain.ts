import { CfgMgr } from "./config/CfgMgr";
import { BattleScene } from "./scene/BattleScene";
import { Bullet } from "./sceneObjs/Bullet";
import { SceneObjType } from "./sceneObjs/SceneObjType";

export class LogicMain {
    private static _instance: LogicMain;
    public static get inst(): LogicMain {
        if (!LogicMain._instance) {
            LogicMain._instance = new LogicMain();
        }
        return LogicMain._instance;
    }

    private ani:Laya.Animation = null;
    init() {
        CfgMgr.inst.init(()=>{ 
            // jojohello temp 先写死，固定开启战斗场景
            let scene = new BattleScene(1);

            // jojohello test
            let keyDownFun = (event)=>{
                if(event.keyCode == Laya.Keyboard.A)
                {
                    let monsterList = scene.getTypeUIDs(SceneObjType.Monster);
                    if(monsterList == null || monsterList.length == 0)
                        return;
                    
                    let bullet = scene.addObjectToScene("Bullet", 1, 1, 100, 100, 0) as Bullet;
                    bullet.initMovement(-1, monsterList[0], 200, 200, 0, 0);
                }
            }
            Laya.stage.on(Laya.Event.KEY_DOWN, this, keyDownFun);
        });
    }

    // jojohello to do 需要加上初始化完成判断
    public isInit(): boolean {
        return true;
    }
}