// jojohello 2023-05-16
// 依赖包加载，包体依赖引用计数，包体自动释放
// 注意：
// 暂时不支持多层依赖！
// 暂时不支持循环依赖！
// 未完成
export class UIPackMgr {
    private static _instance: UIPackMgr;
    public static get inst(): UIPackMgr {
        if (!this._instance) {
            this._instance = new UIPackMgr();
        }

        return this._instance;
    }

    status: number = 0;
    public loadPackage(pkgName: string, handler: Laya.Handler): void {
        fgui.UIPackage.loadPackage(pkgName, Laya.Handler.create(this, ()=> {
            //let dependencesCount = fgui.UIPackage.loadPackage(pkgName);
        }));
    }
}

Laya["UIPackMgr"] = UIPackMgr;