import { BaseView } from "./BaseView";

// jojohello 2023-8-30
export class UIManager {
    private static _inst:UIManager  = null;
    
    public get inst(): UIManager {
        if (!UIManager._inst) {
            UIManager._inst = new UIManager();
        }

        return UIManager._inst;
    }

    public constructor(){

    }

    public openWindow(view:BaseView){
        // 先不考虑依赖包的问题,不考虑cache
        fgui.UIPackage.loadPackage("res/UI/" + view.getPackageName(), Laya.Handler.create(this, ()=> {
            
            //let _panel = fgui.UIPackage.createObject(pkgName, viewName).asCom;
            
        }));
    }
}
