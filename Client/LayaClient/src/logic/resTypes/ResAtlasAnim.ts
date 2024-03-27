import {ResBase, ResBaseProxy} from "./ResBase";
import ResManager from "./ResManager";

export class ResAtlasAnimProxy extends ResBaseProxy{
    private static _myInstance:ResAtlasAnimProxy = null;
    public static get instance():ResAtlasAnimProxy{
        if(ResAtlasAnimProxy._myInstance == null){
            ResAtlasAnimProxy._myInstance = new ResAtlasAnimProxy();
        }

        return ResAtlasAnimProxy._myInstance;
    }

    public onLoadComplete(url:string){
        // 用来注册动画片段，用于使用动作名来播放动画
        // 这种写法用于自己建表来记录动画相关信息，这里写死作为示例，项目中要换成其他代码
        // 另外一种方法，使用Laya IDE编辑动画，得到一份json文件，理论上更推荐这种方法
        this.createFrameAnimModel(url, "moveB", 8);        // 这里的animName是写死的，项目应该根据自己的情况，建表或者约定规则
        this.createFrameAnimModel(url, "moveC", 8);
        this.createFrameAnimModel(url, "moveE", 8);
        this.createFrameAnimModel(url, "moveF", 8);
        this.createFrameAnimModel(url, "moveH", 8);
        this.createFrameAnimModel(url, "moveI", 8);
        this.createFrameAnimModel(url, "moveK", 8);
        this.createFrameAnimModel(url, "moveL", 8);
    }

    // 这个函数意味着，每张小图必须以动作命+数字来命名，数字为1到length-1，图片类型为png
    private createFrameAnimModel(url:string, animName:string, length:number){
        let end = url.indexOf(".atlas");
        let altasName = url.substring(0, end);
        let animList = [];
        for(let i=0; i<length; i++){
            animList.push(altasName + "/" + animName + i + ".png");
        }

        let graphics = Laya.Animation.createFrames(animList, animName);
        if(graphics.length > 0){
            let _resInfo = ResManager.instance.getRefInfo(url);
            if(_resInfo != null && _resInfo.bounds == null){
                _resInfo.bounds = graphics[0].getBounds();
            }
        }
    }

    public clearRes(url:string){
        //console.error("jojohello log clear Atlas url:" + url);
        Laya.loader.clearRes(url);
    }
}

export class ResAtlasAnim extends ResBase{
    private _animHeader:string = ""; // 预先保存一下，以减少后面的开销

    public buildRes():void {
        if(this._res == null){
            this._res = new Laya.Animation();
            this._res.atlas = Laya.Loader.getAtlas(this._url);
        }

        Laya.stage.addChild(this._res);
        // this._res.pos(this._x, this._y);
        // this._res.pivot(this._pivotX, this._pivotY);
        this._res.visible = true;

        if(this._animName != null && this._animName != ""){
            this.play(this._animName, this._isLoop, true);
        }
    }

    public play(aniName:string, isLoop:boolean, force:boolean):void
    {
        // jojohello test 先写死
        aniName = "moveB";
        isLoop = true;

        if(this._animName == aniName && !force && isLoop)
            return;

        this._animName = aniName;
        this._isLoop = isLoop;
        if(this._res == null)
            return;

        this._res.play(0, isLoop, this._animHeader + this._animName);
    }

    onRecycle():void {
        if(this._res == null)
            return;

        this._res.stop();
        this._res.visible = false;
        this._res.removeSelf();
    }

    onDispose():void {
        this._res.stop();
        this._res.removeSelf();
        this._res.destroy();
        this._res = null;
    }
}