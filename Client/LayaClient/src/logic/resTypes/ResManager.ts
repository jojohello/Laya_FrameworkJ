
// 计划使用这个类，对场景的一些资源，通过这个管理器进行加载，好进行引用计数，对没有引用的资源，进行释放

import {ResBase} from "./ResBase";
import { ResAtlasAnim, ResAtlasAnimProxy } from "./ResAtlasAnim";
import { ResNativeSpine, ResNativeSpineProxy } from "./ResNativeSpine";
import { ResTimelineAnim, ResTimelingAnimProxy } from "./ResTimelineAnim";
// import { ResSpine, ResSpineProxy } from "./ResSpine";

export class RefInfo{
    public refCount:number = 0;
    public lastUseTime:number = 0;
    public proxy:any = null;
    public bounds:Laya.Rectangle = null;
}

const CACHE_TIME:number = 100;

// 这里的资源，主要针对 图片、sprite库动画，内置sprite动画、帧动画资源
export default class ResManager{
    private static _instance:ResManager = null;
    public static get instance():ResManager{
        if(ResManager._instance == null){
            ResManager._instance = new ResManager();
            Laya.timer.loop(300, ResManager._instance, ResManager._instance.update);
        }

        return ResManager._instance;
    }

    private _refInfoDict:Map<string, RefInfo> = new Map<string, RefInfo>();
    private _cacheResDict:Map<string, ResBase[]> = new Map<string, ResBase[]>();
    private _resStateDict:Map<string, number> = new Map<string, number>();  // 0:未加载，1:加载中，2:加载完成
    private _loadingResDict:Map<string, ResBase[]> = new Map<string, ResBase[]>();

    public getRefInfo(url:string):RefInfo{
        return this._refInfoDict.get(url);
    }

    private __tempCacheList:ResBase[] = null;
    public recoverRes(res:ResBase){
        if(res == null){
            return;
        }

        this.__tempCacheList = this._cacheResDict.get(res.url);
        if(this.__tempCacheList == null){
            this.__tempCacheList = [];
        }

        this.subRefCounter(res.url);
        this.__tempCacheList.push(res);
        res.clearBuildResHandler();
        res.onRecycle();

        this._cacheResDict.set(res.url, this.__tempCacheList);
    }

    private __tempDelUrlList = [];
    public update():void{
        for(let [url, refInfo] of this._refInfoDict){
            if(refInfo.refCount > 0){
                continue;
            }

            if(Date.now() - refInfo.lastUseTime < CACHE_TIME){
                continue;
            }

            // 直接清理掉全部cache，并释放资源
            this.__tempCacheList = this._cacheResDict.get(url);
            for(let i = 0; i < this.__tempCacheList.length; i++){
                this.__tempCacheList[i].onDispose();
            }
            this._cacheResDict.delete(url);
            this._resStateDict.delete(url);
            this._loadingResDict.delete(url);
            //Laya.Loader.clearRes(url);  // 卸载资源
            refInfo.proxy.clearRes(url);// 卸载资源
            this.__tempDelUrlList.push(url);

            //console.error("jojohello log clear res url:" + url);

            // 可以分批处理，避免卡顿
            if(Laya.stage.getTimeFromFrameStart() > 32)
            {
                break;
            }
        }

        if(this.__tempDelUrlList.length > 0){
            for(let i = 0; i < this.__tempDelUrlList.length; i++){
                this._refInfoDict.delete(this.__tempDelUrlList[i]);
            }
            this.__tempDelUrlList.length = 0;
        }
    }

    // public getSpine(url:string, onBuildResHandler:Laya.Handler){
    //     return this.getRes(url, ResSpine, ResSpineProxy.instance, onBuildResHandler);
    // }

    public getNativeSpine(url:string, onBuildResHandler:Laya.Handler){
        return this.getRes(url, ResNativeSpine, ResNativeSpineProxy.instance, onBuildResHandler);
    }

    public getAltasAnim(url:string, onBuildResHandler:Laya.Handler){
        return this.getRes(url, ResAtlasAnim, ResAtlasAnimProxy.instance, onBuildResHandler);
    }

    public getTimelineAnim(url:string, onBuildResHandler:Laya.Handler){
        return this.getRes(url, ResTimelineAnim, ResTimelingAnimProxy.instance, onBuildResHandler);
    }

    // 将获取资源的通用步骤写在这里
    private getRes(url:string, classType:any, resProxy:any, onBuildResHandler?:Laya.Handler):any{
        this.addRefCounter(url, resProxy);

        this.__tempCacheList = this._cacheResDict.get(url);
        if(this.__tempCacheList != null && this.__tempCacheList.length > 0){
            let ret = this.__tempCacheList.pop();
            ret.registerBuildResHandler(onBuildResHandler);
            ret.buildRes();
            ret.initTransform();
            Laya.timer.frameOnce(1, this, function(){ ret.afterBuildRes(); });// 延迟一帧，避免一些问题
            return ret;
        }

        let res = new classType(url);
        res.registerBuildResHandler(onBuildResHandler);

        let resState = this._resStateDict.get(url);
        if(resState == null || resState == 0){
            //Laya.loader.load(url, Laya.Handler.create(this, function(){ this.onLoadFrameAnimResComplete(url); }));
            resProxy.load(url, 
                Laya.Handler.create(this, this.onLoadComplete, [url, resProxy]));
                // Laya.Handler.create(this, this.onLoadError, [url, resProxy]));
            
            this._resStateDict.set(url, 1);
            this._loadingResDict.set(url, [res]);
        }else if(resState == 1){
            this._loadingResDict.get(url).push(res);
        }else{
            res.buildRes();
            res.initTransform();
            Laya.timer.frameOnce(1, this, function(){ res.afterBuildRes(); });// 延迟一帧，避免一些问题
        }

        return res;
    }

    private onLoadComplete(url:string, proxy:any):void{
        if(this._resStateDict.get(url) == null){
            return;
        }
        this._resStateDict.set(url, 2);

        proxy.onLoadComplete(url);

        for(let res of this._loadingResDict.get(url)){
            res.buildRes();
            res.initTransform();
            Laya.timer.frameOnce(1, this, function(){ res.afterBuildRes(); });// 延迟一帧，避免一些问题
        }

        this._loadingResDict.delete(url);
    }

    // Jojohello to do Laya.Loader.load里面,不存在onError回调,后面看怎么实现一个
    // private onLoadError(url:string, proxy:any):void{
    //     console.error("error load res: " + url + " fail!!!");
    //     // 清除状态，清除正在等待实例化的资源的数据
    //     this._resStateDict.set(url, 0);
    //     this._loadingResDict.delete(url);
    // }
//----------------------------------------------------------------------


    private __tempResInfo:RefInfo = null;
    private addRefCounter(url:string, proxy:any = null):void{
        this.__tempResInfo = this._refInfoDict.get(url);
        if(this.__tempResInfo == null){
            this.__tempResInfo = new RefInfo();
            this.__tempResInfo.proxy = proxy;
        }

        this.__tempResInfo.refCount++;
        this.__tempResInfo.lastUseTime = Date.now();
        this._refInfoDict.set(url, this.__tempResInfo);

        this.__tempResInfo = null;

        // jojohello log
        //console.error("jojohello refCount: " + this._refInfoDict.get(url).refCount);
    }

    private subRefCounter(url:string):void{
        this.__tempResInfo = this._refInfoDict.get(url);
        if(this.__tempResInfo == null){
            return;
        }

        this.__tempResInfo.refCount--;
        this.__tempResInfo.lastUseTime = Date.now();
        this._refInfoDict.set(url, this.__tempResInfo);

        this.__tempResInfo = null;
        // jojohello log
        //console.error("jojohello refCount: " + this._refInfoDict.get(url).refCount);
    }
}