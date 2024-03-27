import { ResBase, ResBaseProxy } from "./ResBase";

export class ResImage extends ResBase{
    private _loadHander:Laya.Handler = null;
    private _animHeader:string = ""; // 预先保存一下，以减少后面的开销

    public buildRes():void {
        if(this._res == null){
            this._res = new Laya.Sprite();
            this._res.url = this._url;
        }

        if(this._res == null)
            return;

        Laya.stage.addChild(this._res);
        // this._res.pos(this._x, this._y);
        // this._res.rotation = this._rotation;
        this._res.visible = true;

        if(this._animName != null && this._animName != ""){
            this.play(this._animName, this._isLoop, true);
        }
    }

    public play(aniName:string, isLoop:boolean, force:boolean):void
    {

    }

    onRecycle():void {
        if(this._res == null)
            return;

        this._res.visible = false;
        this._res.removeSelf();
    }

    onDispose():void {
        this._res.removeSelf();
        this._res.destroy();
        this._res = null;
    }
}