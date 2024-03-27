// jojohello 2024-2-7 相对于ResFrameAnim，这里采取的是通过加载Laya的.anim文件来形成动画
// 相对于ResFrameAnim，这里的ResLayaAnim更加符合Laya的通用流程

import {ResBase, ResBaseProxy} from "./ResBase";
import ResManager from "./ResManager";

export class ResTimelingAnimProxy extends ResBaseProxy{
    private static _myInstance:ResTimelingAnimProxy = null;
    public static get instance():ResTimelingAnimProxy{
        if(ResTimelingAnimProxy._myInstance == null){
            ResTimelingAnimProxy._myInstance = new ResTimelingAnimProxy();
        }

        return ResTimelingAnimProxy._myInstance;
    }

    public load(url:string, complete:Laya.Handler, error:Laya.Handler):void{
        // 需要同时加载图集以及ani文件
        let atlasUrl = ["res/atlas/" + url.replace(".ani", ".atlas"), url];
        Laya.loader.load(atlasUrl, complete);
    }

    public clearRes(url:string){
        // 要同时清理图集以及ani文件
        Laya.loader.clearRes("res/atlas/" + url.replace(".ani", ".atlas"));
        Laya.loader.clearRes(url);

        // jojohello 2024-2-7 这里的clearCache是清理掉缓存在Layaw.Animation.framesMap动画数据，
        // 如果不清理这个数据，当序列帧对应的atlas被卸载后，如果再次加载，动画将不能播放（有可能是framesMap里面的信息，指向了atlas的实例造成的）
        // 但是，这个clearCache的过程，是一个遍历framesMap，并且是进行字符串比较的过程，效率极低，如果有大量的序列帧动画，这个过程有可能会造成卡顿
        // 因此，后续需要考虑进行优化，比如，在加载多段动画的时候，记录下动画的名字，然后再这里自己去一个个消除map中的缓存数据
        Laya.Animation.clearCache(url);
    }
}

export class ResTimelineAnim extends ResBase{
    public buildRes():void {
        if(this._res == null){
            this._res = new Laya.Animation();
            this._res.loadAnimation(this._url);
        }

        Laya.stage.addChild(this._res);
        // this._res.pos(this._x, this._y);
        // this._res.pivot(this._pivotX, this._pivotY);
        // this._res.rotation = this._rotation;
        this._res.visible = true;

        if(this._animName != null && this._animName != ""){
            this.play(this._animName, this._isLoop, true);
        }
    }

    public play(aniName:string, isLoop:boolean, force:boolean):void
    {
        if(this._animName == aniName && !force && isLoop)
            return;

        this._animName = aniName;
        this._isLoop = isLoop;
        if(this._res == null)
            return;

        this._res.play(0, isLoop, this._animName);
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