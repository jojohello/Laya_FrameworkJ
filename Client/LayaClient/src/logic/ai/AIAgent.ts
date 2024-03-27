// jojohello 2023-6-24 ai代理器，用来运行ai行为树，定义ai的思考间隔等
import { BBaseNode } from "../behaviorTree/BehaviorNodes";

let AI_THINK_INTERVAL = 100;

export class AIAgent {
	private _stop = false;
	private _aiTree: BBaseNode = null;
	private _nextThinkTime: number = 0;

	public constructor(aiTree: BBaseNode) {
		this._aiTree = aiTree;
	}

	public update(owner:any, curTime: number): void {
		if (this._stop) {
			return;
		}

		if(this._nextThinkTime > curTime) {
			return;
		}

		this._nextThinkTime = curTime + AI_THINK_INTERVAL;

		this._aiTree.execute(owner, curTime);
	}

	public stop(): void {
		this._stop = true;
	}

	public resume(): void {
		this._stop = false;
	}
}