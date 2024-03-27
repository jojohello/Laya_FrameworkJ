export abstract class BaseView {
    protected _isRelease:boolean = false;
    protected _view:any = null; 
    protected _isShown:boolean = false;
    protected _x:number = 0;
    protected _y:number = 0;

    protected _events:Map<number, any> = null;

    // 相当于界面的必要参数，必要实现
    public abstract getPackageName(): string;
    public abstract getViewName(): string;
    
    public isShown(): boolean {
        return this._isShown;
    }

    public show(): void {
        if (this._isRelease) {
            return;
        }
        
        if(!this._view){
            this._isShown = true
            fgui.UIPackage.loadPackage("res/UI/" + this.getPackageName(), Laya.Handler.create(this, ()=>{
                if(this._isRelease)
                    return;
                
                this._view = fgui.UIPackage.createObject(this.getPackageName(), this.getViewName()).asCom;
                this.onViewLoaded();
                
                // jojohello to do 后面加入到对应的层里面去，并放到最上层去
                fgui.GRoot.inst.addChild(this._view);
                this._view.setXY(this._x, this._y);

                if(this._isShown){
                    this._view.visible = true;
                    this.onShown();
                    this.registerEvent();
                }else{
                    this._view.visible = false;
                }
            }))
        }else if(!this._isShown){
                this._isShown = true;
                this._view.visible = true;
                // jojohello to do 要把界面放到最上层
                this.onShown();
                this.registerEvent();
        }
    }

    public hide(): void {
        if(!this._isShown)
            return;
        
        this._isShown = false;
        if(this._view){
            this._view.visible = false;
            this.unregisterEvent();
        }
        
        this.onHide();
    }

    public onShown(): void {
        
    }

    public onHide(): void {
        
    }

    protected onViewLoaded(): void {

    }

    private registerEvent(){
        if(!this._events)
            return;

        for(const [id, callback] of this._events){
            Laya.EventEmitter.inst.on(id, callback)
        }
    }

    private unregisterEvent(){
        if(!this._events)
            return;

        for(const [id, callback] of this._events){
            Laya.EventEmitter.inst.off(id, callback)
        }
    }

    public release(): void {
        this._isRelease = true

        // 先隐藏界面
        this.hide();

        // 释放界面的资源
        if(this._view){
            this._view.dispose();
            this._view = null;
            this.onDisposeView();
        }
    }

    protected onDisposeView(): void {
    }

    public recover(): void {
        if(this._isRelease){
            this._isRelease = false;
        }

        if(this._view){
            this._view.dispose();
            this._view = null;
        }
    }

    public setPosByGlobal(x, y){
        this._x = x;
        this._y = y;

        if(this._view){
            let newPos = Laya.Point.create();
            this._view.parent.globalToLocal(x, y, newPos);
            this._view.setXY(newPos.x, newPos.y);
            newPos.recover();
        }
    }
}
