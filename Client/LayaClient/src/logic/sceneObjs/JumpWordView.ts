import { BaseView } from "../UICore/BaseView";
import MyCacher from "../utils/MyCacher";

export class JumpWordView extends BaseView{
    public getPackageName(): string{
        return "SceneObj";
    }

    public getViewName(): string{
        return "jumpWord";
    }

    static _isRegister:boolean = false;
    public static play(x:number, y:number, count:number):void{
        if(JumpWordView._isRegister == false){
            Laya.ClassUtils.regClass("JumpWordView", JumpWordView);
        }

        let newView = MyCacher.getObj("JumpWordView");
        newView.recover();
        newView.setPosByGlobal(x, y);
        newView.setCount(count);
        newView.show();
    }

    private _count = 0;
    
    public onShown(): void{
        this.setPosByGlobal(this._x, this._y);
        this._view.words.text = this._count.toString();
        this._view.popAnim.play();

        Laya.timer.once(2000, this, ()=>{ 
            this.hide(); 
            this.release();
            MyCacher.recycleObj(this);
        });
    }

    public setCount(count:number){
        this._count = count;
        if(this._view){
            this._view.words.text = count.toString();
        }
    }
}