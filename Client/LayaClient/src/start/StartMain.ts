// jojohello 2023-05-16
// start 文件夹作为微信分包的首包，StartMain.ts 作为首包的入口文件
import { LogicMain } from "../logic/LogicMain";
import { EventEmitter } from "./Event/EventEmitter";
import { EventId } from "./Event/EventId";
import { MyGobalValue } from "./utils/MyGobalValue";

export class StartMain{
    constructor(){
        EventEmitter.inst.on(EventId.click_enter_game, this.onClickEnterGame)
    }

    // 开启这个首包流程
    start(){
        // 先启动引擎相关，最初始的配置
        this.initEngine();

        // jojohello temp 测试得时候，直接启动游戏逻辑
        // 测试项目一定要经过StartMain启动，不然得话EventEmitter不会被加载进来
        //LogicMain.inst.init();
    }

    private initEngine(){
        Laya.loader.retryNum = 20;
        Laya.loader.retryDelay = 1000;
        Laya.loader.maxLoader = 5;

        this.initFormatURL();

        MyGobalValue.init();

        // ui 放到最上层
        Laya.stage.addChild(fgui.GRoot.inst.displayObject);
		fgui.GRoot.inst.displayObject.zOrder = 100;

        // jojohello to do 在这里加载不是常规做法，常规做法应该是fgui可以根据以来pacakge进行自行加载
        // 加载通用pacakge
        fgui.UIPackage.loadPackage("res/UI/Common", Laya.Handler.create(this, ()=>{LogicMain.inst.init();}));
    }

    // 优先显示loading界面
    private loadLoginView(){
        fgui.UIPackage.loadPackage("startRes/Login", Laya.Handler.create(this, this.onLoginViewLoaded));
    }

    // 这里总领整个进入游戏的流程，因此会把等待界面相关的东西都写在这里
    private onLoginViewLoaded(){
        let _view = fgui.UIPackage.createObject("Login", "LoginView").asCom;
        _view.makeFullScreen();
        fgui.GRoot.inst.addChild(_view);
    }

    private onClickEnterGame(){
        
    }

    static urlMap = new Map<string, string>();
    static urlRet:string = null;
    private initFormatURL(){
        // web的情况下，使用本地加载，否则转成远端下载
        if(MyGobalValue.isWX == false)
            return;

        Laya.URL.formatURL = function (url: string, base?: string): string {
            if(url.startsWith("http"))
                return url;

            StartMain.urlRet = StartMain.urlMap.get(url);
            if(StartMain.urlRet != null)
                return StartMain.urlRet;
            
            // 新路径为cdn+url+?v=版本号
            StartMain.urlRet = MyGobalValue.cdn + url + "?v=" + MyGobalValue.version;
            StartMain.urlMap.set(url, StartMain.urlRet);
            return StartMain.urlRet;
        }
    }
}
