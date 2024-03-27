
export class BaseState {
	protected _stateName: string = null;
	public getStateName(): string{
		if(!this._stateName){
			this._stateName = this.constructor.name.replace("State", "");
		}

		return this._stateName;
	}

	public onEnter(owner:any):void {};
	public onUpdate(owner:any, curTime:number): void {};
	public onExit(owner:any): void {};
}
  
export class StateMachine {
	protected currentState: BaseState = null;
	protected stateMap: Map<string, BaseState> = new Map<string, BaseState>();
  
	constructor() {

	}
  
	public registerState(state: BaseState): void {
		this.stateMap.set(state.getStateName(), state);
	}

	public setState(stateName:string, owner:any): void {
		if (this.currentState != null) {
			this.currentState.onExit(owner);
		}

		this.currentState = this.stateMap.get(stateName);

		if (this.currentState != null) {
			this.currentState.onEnter(owner);
		}
	}
  
	public update(owner:any, curTime:number): void {
		if (this.currentState != null) {
	  		this.currentState.onUpdate(owner, curTime);
		}
	}

	public getCurStateName(): string {
		if(!this.currentState)
			return "";
		
		return this.currentState.getStateName();
	}
}