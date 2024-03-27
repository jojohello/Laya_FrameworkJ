import {ResBase, ResBaseProxy} from "./ResBase";

export class ResNativeSpineProxy extends ResBaseProxy{
    private static _myInstance:ResNativeSpineProxy = null;
    public static get instance():ResNativeSpineProxy{
        if(ResNativeSpineProxy._myInstance == null){
            ResNativeSpineProxy._myInstance = new ResNativeSpineProxy();
        }

        return ResNativeSpineProxy._myInstance;
    }

    private _templetDict:Map<string, Laya.Templet> = new Map<string, Laya.Templet>();

    public load(url:string, complete:Laya.Handler, error:Laya.Handler):void{
        let templet:Laya.Templet = this._templetDict.get(url);
        if(templet != null){    // 已经在加载中
            return;
        }

        templet = new Laya.Templet();
        this._templetDict.set(url, templet);

        templet.on(Laya.Event.COMPLETE, this, ()=>{ complete?.run(); } );
        templet.on(Laya.Event.ERROR, this, ()=>{ error?.run(); });
        templet.loadAni(url);
    }

    public onLoadError(url){
        this._templetDict.delete(url);   
    }

    public clearRes(url:string){
        let __templete:Laya.Templet = this._templetDict.get(url);
        if(__templete == null)
            return;
        
        this._templetDict.delete(url);
        __templete.destroy();
        __templete = null;
    }

    public buildRes(url:string):Laya.Skeleton{
        let __templete:Laya.Templet = this._templetDict.get(url);
        if(__templete == null)
            return null;

        return __templete.buildArmature(0);
    }
}

export class ResNativeSpine extends ResBase{
    private _loadHander:Laya.Handler = null;
    private _animHeader:string = ""; // 预先保存一下，以减少后面的开销

    public buildRes():void {
        if(this._res == null){
            this._res = ResNativeSpineProxy.instance.buildRes(this._url);
        }

        if(this._res == null)
            return;

        Laya.stage.addChild(this._res);
        this._res.pos(this._x, this._y);
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

        this._res.play(this._animName, isLoop);
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