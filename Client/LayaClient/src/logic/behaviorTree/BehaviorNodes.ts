// jojohello 2023-6-24 行为树基础节点

export abstract class BBaseNode {
	/**
	 * 执行
	 * @param owner 执行者
	 * @param curTime 当前时间,毫秒
	 * @return 是否执行成功
	 * */
	public abstract execute(owner:any, curTime:number): boolean;
}

export abstract class BCompositeNode extends BBaseNode {
	public constructor() {
		super();
	}

	protected _childList: Array<BBaseNode> = new Array<BBaseNode>();

	public addChild(child: BBaseNode): void {
		this._childList.push(child);
	}
}

export class BSelectorNode extends BCompositeNode {
	public constructor() {
		super();
	}

	public execute(owner:any, curTime:number): boolean {
		let child = null
		for (let i = 0; i < this._childList.length; i++) {
			child = this._childList[i];
			if (child.execute(owner, curTime)) {
				return true;
			}
		}

		return false;
	}
}

export class BSequenceNode extends BCompositeNode {
	public constructor() {
		super();
	}

	public execute(owner:any, curTime:number): boolean {
		let child = null
		for (let i = 0; i < this._childList.length; i++) {
			child = this._childList[i];
			if (!child.execute(owner, curTime)) {
				return false;
			}
		}

		return true;
	}
}

export class BParallelNode extends BCompositeNode {
	public constructor() {
		super();
	}

	public execute(owner:any, curTime:number): boolean {
		let child = null
		for (let i = 0; i < this._childList.length; i++) {
			child = this._childList[i];
			child.execute(owner, curTime);
		}

		return true;
	}
}

// 下面得节点类型比较少用到，暂时不开放了
// export class BDecoratorNode extends BBaseNode {
// 	protected _child: BBaseNode = null;

// 	public constructor() {
// 		super();
// 	}

// 	public execute(owner:any, curTime:number): boolean {
// 		if (this._child == null) {
// 			return false;
// 		}

// 		return this._child.execute(owner, curTime);
// 	}
// }

// export class BInverterNode extends BDecoratorNode {
// 	public constructor() {
// 		super();
// 	}

// 	public execute(owner:any, curTime:number): boolean {
// 		if (this._child == null) {
// 			return false;
// 		}

// 		return !this._child.execute(owner, curTime);
// 	}
// }

// export class BRepeaterNode extends BDecoratorNode {
// 	protected _count: number = 0;
// 	protected _maxCount: number = 0;

// 	public constructor(maxCount: number) {
// 		super();
// 		this._maxCount = maxCount;
// 	}

// 	public execute(owner:any, curTime:number): boolean {
// 		if (this._child == null) {
// 			return false;
// 		}

// 		if (this._count >= this._maxCount) {
// 			return false;
// 		}

// 		if (!this._child.execute(owner, curTime)) {
// 			return false;
// 		}

// 		this._count++;
// 		return true;
// 	}
// }