// import {ResBase, ResBaseProxy} from "./ResBase";

// export class ResSpineProxy extends ResBaseProxy{
//     private static _myInstance:ResSpineProxy = null;
//     public static get instance():ResSpineProxy{
//         if(ResSpineProxy._myInstance == null){
//             ResSpineProxy._myInstance = new ResSpineProxy();
//         }

//         return ResSpineProxy._myInstance;
//     }

//     private _templetDict:Map<string, Laya.SpineTemplet> = new Map<string, Laya.SpineTemplet>();

//     public load(url:string, complete:Laya.Handler, error:Laya.Handler):void{
//         let templet:Laya.SpineTemplet = this._templetDict.get(url);
//         if(templet != null){    // 已经在加载中
//             return;
//         }

//         templet = new Laya.SpineTemplet(Laya.SpineVersion.v3_7); // 要注意Spine版本以及Spine库的版本
//         this._templetDict.set(url, templet);

//         templet.on(Laya.Event.COMPLETE, this, ()=>{ complete?.run(); } );
//         templet.on(Laya.Event.ERROR, this, ()=>{ error?.run(); });
//         templet.loadAni(url);
//     }

//     public onLoadError(url){
//         this._templetDict.delete(url);   
//     }

//     public clearRes(url:string){
//         let __templete:Laya.SpineTemplet = this._templetDict.get(url);
//         if(__templete == null)
//             return;
        
//         this._templetDict.delete(url);
//         __templete.destroy();
//         __templete = null;
//     }

//     public buildRes(url:string):Laya.SpineSkeleton{
//         let __templete:Laya.SpineTemplet = this._templetDict.get(url);
//         if(__templete == null)
//             return null;

//         return __templete.buildArmature();
//     }
// }

// export class ResSpine extends ResBase{
//     private _loadHander:Laya.Handler = null;
//     private _animHeader:string = ""; // 预先保存一下，以减少后面的开销

//     public buildRes():void {
//         if(this._res == null){
//             this._res = ResSpineProxy.instance.buildRes(this._url);
//         }

//         if(this._res == null)
//             return;

//         Laya.stage.addChild(this._res);
//         this._res.pos(this._x, this._y);
//         this._res.visible = true;

//         if(this._animName != null && this._animName != ""){
//             this.play(this._animName, this._isLoop, true);
//         }
//     }

//     public play(aniName:string, isLoop:boolean, force:boolean):void
//     {
//         if(this._animName == aniName && !force && this._isLoop == isLoop)
//             return;

//         this._animName = aniName;
//         this._isLoop = isLoop;
//         if(this._res == null)
//             return;

//         this._res.play(this._animName, this._isLoop);
//     }

//     onRecycle():void {
//         if(this._res == null)
//             return;

//         this._res.stop();
//         this._res.visible = false;
//         this._res.removeSelf();
//     }

//     onDispose():void {
//         this._res.stop();
//         this._res.removeSelf();
//         this._res.destroy();
//         this._res = null;
//     }
// }