import { BaseSceneObj } from "./BaseSceneObj";
import { SceneObjType } from "./SceneObjType";
import { CfgMgr } from "../config/CfgMgr";
import MathUtils from "../utils/MathUtils";
import { BattleScene } from "../scene/BattleScene";
import { BaseScene } from "../scene/BaseScene";

const max_round = 8;	// 暂定最多8波怪

class CreateInfo {
	monsterIds:number[] = [];
	monsterNums:number[] = [];
}

export class MonsterCreater extends BaseSceneObj {
	protected _startTime:number = -1;
	protected _index:number = 0;
	protected _bornMosterType:number = 0;
	protected _maxRound:number = 0;
	protected _delayTimeList:number[] = [];
	protected _bornMonsterInfos:CreateInfo[] = [];
	protected _isAllCreated:boolean = false;

	protected onInit(uid:number, cfgId:number, scene:BaseScene, team:number, x:number, y:number, angle:number): void {
		this._cfg = CfgMgr.inst.getCfg("Producer", this._cfgId);
		for(let i = 1; i<=max_round; i++) {
			let delay = this._cfg["Delay" + i];
			let monsterInfoStr = this._cfg["Born" + i];

			if(monsterInfoStr == "")
				break;

			this._maxRound = i;
			this._delayTimeList.push(delay * 1000);
			let monsterGroup = monsterInfoStr.split("|");
			let newData = new CreateInfo();
			for (let j=0; j<monsterGroup.length; j++) {
				let monsterInfo = monsterGroup[j].split(":");
				
				newData.monsterIds.push(parseInt(monsterInfo[0]));
				newData.monsterNums.push(parseInt(monsterInfo[1]));
			}

			this._bornMonsterInfos.push(newData);
		}
	}

	public getObjType(): number {
		return SceneObjType.MonsterCreater;
	}

	protected loadRes():void {
	}

	public start(curTime) {
		this._startTime = curTime;
		this._index = 0;
		this._isAllCreated = false;
	}

	public update(curTime) {
		if(this._startTime == -1 || this._isAllCreated) {
			return;
		}

		if(curTime - this._startTime < this._delayTimeList[this._index]) {
			return;
		}

		let info = this._bornMonsterInfos[this._index];
		for(let i=0; i<info.monsterIds.length; i++) {
			let monsterId = info.monsterIds[i];
			let monsterNum = info.monsterNums[i];
			for(let j=0; j<monsterNum; j++) {
				let bornPos = this._transform.getPos();
				bornPos.x += MathUtils.random(-10, 10) * 5;
				bornPos.y += MathUtils.random(-10, 10) * 5;
				
				BattleScene.curInst.addObjectToScene("Monster", monsterId, this.team, bornPos.x, bornPos.y, 0)
				bornPos.recover();
			}
		}

		this._index++;
		if(this._index >= this._maxRound) {
			this._isAllCreated = true;
		}
	}
}