import ResManager from "./ResManager";

export class ResBaseProxy{
    private static _instance:ResBaseProxy = new ResBaseProxy();
    public static get instance():ResBaseProxy{
        if(ResBaseProxy._instance == null){
            ResBaseProxy._instance = new ResBaseProxy();
        }

        return ResBaseProxy._instance;
    }

    public load(url:string, complete:Laya.Handler, error:Laya.Handler):void{
        Laya.loader.load(url, complete);
    }

    public onLoadComplete(url){

    }

    public onLoadError(url){
        
    }

    public clearRes(url:string){
        Laya.loader.clearRes(url);
    }
}


export abstract class ResBase {
    protected _x:number;
    protected _y:number;
    protected _url:string;
    protected _animName:string;
    protected _isLoop:boolean;
    protected _res:any;
    protected _resReady:boolean = false;
    protected _buildResHandler:Laya.Handler = null;  // 进入场景的时候要做的事情
    protected _pivotX:number = 0;
    protected _pivotY:number = 0;
    protected _rotation:number = 0;

    constructor(url:string){
        this._url = url;
    }

    public setParent(parent:any):void{
        parent.addChild(this._res);
    }

    public registerBuildResHandler(hander:Laya.Handler):void{
        this._buildResHandler = hander;
    }

    public clearBuildResHandler(){
        if(this._buildResHandler != null){
            this._buildResHandler.recover();
            this._buildResHandler = null;
        }
    }

    public afterBuildRes():void{
        if(this._buildResHandler != null){
            this._buildResHandler.run();
        }
    }

    public initTransform():void{
        if(this._res == null)
            return;

        this._res.pos(this._x, this._y);
        this._res.pivot(this._pivotX, this._pivotY);
        this._res.rotation = this._rotation;
    }

    // 这个调用一般要在setParent之后
    public setScale(scaleX:number, scaleY:number):void{
        if(this._res == null)
            return;

        this._res.scaleX = scaleX;
        this._res.scaleY = scaleY;
    }

    public localToGlobal(pos:Laya.Point):Laya.Point{
        if(this._res == null)
        {
            pos.setTo(0, 0);
            return pos;
        }
        
        return this._res.localToGlobal(pos);
    }

    public get url():string{
        return this._url;
    }

    public pos(x:number, y:number):void{
        this._x = x;
        this._y = y;
        if(this._res != null){
            this._res.pos(x, y);
        }
    }

    public pivot(x:number, y:number):void{
        this._pivotX = x;
        this._pivotY = y;
        if(this._res != null){
            this._res.pivot(x, y);
        }
    }

    // public getWidth():number{
    //     let refInfo = ResManager.instance.getRefInfo(this._url);
    //     return refInfo?refInfo.width:0;
    // }

    // public getHeight():number{
    //     let refInfo = ResManager.instance.getRefInfo(this._url);
    //     return refInfo?refInfo.height:0;
    // }

    public getBounds():Laya.Rectangle{
        let refInfo = ResManager.instance.getRefInfo(this._url);
        return refInfo?refInfo.bounds:null;
    }

    public set rotation(v:number){
        this._rotation = v;
        if(this._res != null){
            this._res.rotation = v;
        }
    }

    // 不同的资源，不同的销毁方式
    abstract onRecycle():void
    abstract onDispose():void;   
    abstract buildRes():void;
    abstract play(aniName:string, isLoop:boolean, force:boolean):void;
}