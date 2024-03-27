export abstract class BaseCondition{
    public abstract isFit(caster:any, target:any):boolean; 
}

export class AndConditionGroup extends BaseCondition {
    private _conditions:BaseCondition[] = [];
    private _count:number = 0;

    public add(c:BaseCondition){
        this._conditions.push(c);
        this._count = this._conditions.length;
    }

    public isFit(caster:any, target:any){
        for(let i=0; i<this._count; i++){
            if(this._conditions[i].isFit(caster, target) == false)
                return false;
        }

        return true;
    }
}

export class OrConditionGroup extends BaseCondition {
    private _conditions:BaseCondition[] = [];
    private _count:number = 0;

    public add(c:BaseCondition){
        this._conditions.push(c);
        this._count = this._conditions.length;
    }
    
    public isFit(caster:any, target:any){
        for(let i=0; i<this._count; i++){
            if(this._conditions[i].isFit(caster, target) == true)
                return true;
        }

        return false;
    }
}

export class ConditionAgent{
    private _data = []
    private _count = 0;

    public addCondition(newData:BaseCondition){
        this._data.push(newData);
        this._count = this._data.length;
    }

    public isFit(caster:any, target:any){
        for(let i=0; i<this._count; i++){
            if(this._data[i].isFit(caster, target) == false)
                return false;
        }

        return true;
    }
}