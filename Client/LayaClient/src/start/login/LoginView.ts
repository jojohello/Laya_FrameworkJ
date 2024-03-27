// jojohello 2023-05-16

// 先用最原始的方式建立一个登录界面，这里就不用继承baseView之类的，将View跟资源加载分离了
// 后面这种复杂逻辑还是到logic文件夹那边
export class LoginView extends fgui.Window {
    public constructor() {
        super();
    }

    protected onInit(): void {
        this.contentPane = fgui.UIPackage.createObject("Bag", "BagWin").asCom;
        this.center();
    }
}