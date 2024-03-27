import GameConfig from "./GameConfig";
import { LogicMain } from "./logic/LogicMain";
import { StartMain } from "./start/StartMain";

class Main {
	constructor() {
		//根据IDE设置初始化引擎		
		// let w = Laya.Browser.clientWidth
        // let h = Laya.Browser.clientHeight
        
        // let scaleScreen = w / h
        // let targetWidth = GameConfig.width
        // let targetHeight = GameConfig.height

        // if (scaleScreen > 640 / 1136)
        // {
        //     targetWidth = targetHeight * scaleScreen;
        // }else
        // {
        //     targetHeight = targetWidth / scaleScreen;
        // }
		
		Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
		Laya["Physics"] && Laya["Physics"].enable();
		Laya["DebugPanel"] && Laya["DebugPanel"].enable();
		Laya.stage.scaleMode = GameConfig.scaleMode;
		Laya.stage.screenMode = GameConfig.screenMode;
		
		Laya.stage.alignV = GameConfig.alignV;
		Laya.stage.alignH = GameConfig.alignH;
		Laya.stage.bgColor = "#333333";
		//兼容微信不支持加载scene后缀场景
		Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;

		//打开调试面板（通过IDE设置调试模式，或者url地址增加debug=true参数，均可打开调试面板）
		if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true") Laya.enableDebugPanel();
		if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"]) Laya["PhysicsDebugDraw"].enable();
		if (GameConfig.stat) Laya.Stat.show();
		//Laya.alertGlobalError = true;

		//激活资源版本控制，version.json由IDE发布功能自动生成，如果没有也不影响后续流程
		//Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
		let mapNode = new Laya.Node()
		mapNode.name = "mapNode";
		Laya.stage.addChild(mapNode)

		let floorNode = new Laya.Node()
		floorNode.name = "floorNode";
		Laya.stage.addChild(floorNode)

		let playerNode = new Laya.Node()
		playerNode.name = "playerNode";
		Laya.stage.addChild(playerNode)
		
		Laya.stage.addChild(fgui.GRoot.inst.displayObject);

		(new StartMain()).start();
		//--------------------------------------------------
		// Laya.timer.loop(2000, this, function(){
		// 	this.testTimeline();
		// });
		//--------------------------------------------------
		//this.testTimeline();
		//--------------------------------------------------

		//new DemoEntry();
	}

	private tl:Laya.Animation = null;
	private sport:Laya.Sprite = null;
	private testSprite:Laya.Sprite = null;
	private testTimeline():void{
		//创建一个Animation实例
		if(this.tl == null){
			Laya.loader.load(["res/atlas/effect/base_fly_fire.atlas", "effect/base_fly_fire.ani"]
			,Laya.Handler.create(this,this.onLoaded));
		}else{
			this.tl.stop();
			this.tl.removeSelf();
			this.tl.destroy();
			this.tl.clear();
			this.tl = null;
			Laya.Animation.clearCache("effect/base_fly_fire.ani");

			this.sport.removeSelf();
			this.sport.destroy();

			Laya.loader.clearRes("res/atlas/effect/base_fly_fire.atlas");
			Laya.loader.clearRes("/effect/base_fly_fire.ani");

			this.testSprite.removeSelf();
			this.testSprite.destroy();
			this.testSprite = null;
		}
	}

	private onLoaded():void{
        //创建一个Animation实例
        this.tl = new Laya.Animation();
        //加载动画文件
        this.tl.loadAnimation("effect/base_fly_fire.ani");
        //添加到舞台
        Laya.stage.addChild(this.tl);
		this.tl.pos(200, 200);
		this.tl.scale(0.5, 0.5);
        //播放Animation动画
        //this.tl.play(0, true, "ani1");
		this.tl.play(0, true);

		this.tl.rotation = 45;

		this.sport = new Laya.Sprite();
		Laya.stage.addChild(this.sport);
		this.sport.graphics.drawCircle(200, 200, 10, "#ff0000");

		this.testSprite = new Laya.Sprite();
		Laya.stage.addChild(this.testSprite);
		this.testSprite.pos(200, 400);
		this.testSprite.loadImage("effect/base_fly_fire/base_fly_fire_3.png");
    }

	// onVersionLoaded(): void {
	// 	//激活大小图映射，加载小图的时候，如果发现小图在大图合集里面，则优先加载大图合集，而不是小图
	// 	Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
	// }

	// onConfigLoaded(): void {
	// 	//加载IDE指定的场景
	// 	//GameConfig.startScene && Laya.Scene.open(GameConfig.startScene);

	// 	Laya.stage.addChild(fgui.GRoot.inst.displayObject);

	// 	new DemoEntry();
	// }
}
//激活启动类
new Main();
