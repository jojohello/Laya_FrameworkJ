import { CfgMgr } from "../config/CfgMgr";
import { MyUtils } from "../utils/MyUtils";

export default class Attribute{
    private _datas:number[] = [];
    private _baseDatas:number[] = [];
    private _addDatas:number[] = [];
    private static nameDict:Map<string, number> = null;
    private static rateDict:Map<string, number> = null;
    private static baseDict:Map<string, number> = null;

    constructor(){
        if(Attribute.nameDict == null){
            Attribute.initAttrNameDict();
        }

        this._datas = new Array(Attribute.nameDict.size);
        this._baseDatas = new Array(Attribute.nameDict.size);
        this._addDatas = new Array(Attribute.nameDict.size);
        this._datas.fill(0);
        this._baseDatas.fill(0);
        this._addDatas.fill(0);
    }

    private static initAttrNameDict(){
        let cfgTable = CfgMgr.inst.getTable("AttrDef");
        let haveRateList = []

        Attribute.nameDict = new Map<string, number>();
        for(const [id, config] of cfgTable){
            Attribute.nameDict.set(config["name"], config["ID"] - 1);
            if(MyUtils.strEndWith(config["name"], "Rate")) {
                haveRateList.push(config["name"]);
            }
        }

        let rateAttrName = ""
        let baseAttrName = ""
        Attribute.baseDict = new Map<string, number>();
        Attribute.rateDict = new Map<string, number>();
        for(let i = 0; i < haveRateList.length; i++){
            rateAttrName = haveRateList[i];
            baseAttrName = rateAttrName.replace("Rate", "");

            if(!Attribute.nameDict.has(baseAttrName) || !Attribute.nameDict.has(rateAttrName)){
                console.error("属性表，存在不配对的百分比属性：" + rateAttrName);
                continue;
            }

            Attribute.baseDict.set(baseAttrName, Attribute.nameDict.get(rateAttrName));
            Attribute.rateDict.set(rateAttrName, Attribute.nameDict.get(baseAttrName));
        }
    }

    private caculateAttr(name:string):void {
        let index = Attribute.nameDict.get(name);
        if(index == null)
            return;

        let ret = this._baseDatas[index] + this._addDatas[index];
        
        if(Attribute.rateDict.has(name)){
            let baseIndex = Attribute.rateDict.get(name);
            this.setAttr(index, ret)
            this.setAttr(baseIndex, (this._baseDatas[baseIndex] + this._addDatas[baseIndex]) * (1 + this._datas[index] * 0.0001));
        }else if(Attribute.baseDict.has(name)){
            let rateIndex = Attribute.baseDict.get(name);
            this.setAttr(index, ret * (1 + this._datas[rateIndex] * 0.0001));
        }else{
            this.setAttr(index, ret);
        }
    }

    public setBaseAttr(name:string, v:number) {
        let index = Attribute.nameDict.get(name);
        if (index == null)
            return;

        this._baseDatas[index] = v;
        this.caculateAttr(name);
    }

    public getIndex(name:string):number{
        let ret = Attribute.nameDict.get(name);
        if(ret == null)
            return -1;
        
        return ret;
    }

    public addAttr(name:string, v:number) {
        let index = Attribute.nameDict.get(name);
        if (index == null)
            return;

        this._addDatas[index] += v;
        this.caculateAttr(name);
    }

    public getAttr(name:string):number {
        let index = Attribute.nameDict.get(name);
        if (index == null)
            return 0;

        return this._datas[index]; 
    }

    public setAttr(index:number, v:number){
        if(index < 0 || index >= this._datas.length)
            return;

        let oldValue = this._datas[index];
        this._datas[index] = v;

        this.OnAttrChange(index, oldValue, v);
    }

    public clear(){
        this._datas.fill(0);
        this._baseDatas.fill(0);
        this._addDatas.fill(0);
    }

    // 不同的项目，可能需要重写这个函数，比如最大血量发生变化的时候，当前血量也要有相应的变化，就写在这里
    // 但是也要注意，这样效率有可能比较低，如果性能上顶不住，这些内容就要写到caculateAttr那边
    protected OnAttrChange(index:number, oldValue:number, newValue:number){
        
    }
}