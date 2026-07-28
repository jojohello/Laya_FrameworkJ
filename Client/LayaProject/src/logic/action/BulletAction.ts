import { BulletMoveType } from "../skill/SkillInfo";
import { SkillMgr } from "../skill/SkillMgr";
import { BulletSceneObj } from "../sceneObj/BulletSceneObj";
import { ActionContext } from "./ActionRuntime";
import { ActionType } from "./ActionInfo";
import { registerAction } from "./ActionRegistry";
import { BaseAction } from "./BaseAction";

export class BulletAction extends BaseAction {
    execute(context: ActionContext): number {
        const bulletId = this.info.getNumberParam(0);
        const bulletInfo = SkillMgr.instance.getBullet(bulletId);
        if (!bulletInfo) return 0;
        const caster = context.scene.getLiveObject(context.casterId);
        if (!caster) return 0;

        const targetObj = context.targetId ? context.scene.getLiveObject(context.targetId) : null;
        if (context.targetId && !targetObj) {
            console.warn(
                `[DBG-BULLET-HIT] cancel bullet=${bulletId}` +
                ` caster=${caster.uid}/team${caster.team}` +
                ` target=${context.targetId} reason=target_not_live`
            );
            return 0;
        }

        const bullet = context.scene.addObjectToScene(
            "BulletSceneObj",
            bulletId,
            caster.team,
            caster.x,
            caster.y,
            0
        ) as BulletSceneObj | null;
        if (!bullet) return 0;

        const data = bulletInfo.data;
        const targetX = context.targetX ?? caster.x;
        const targetY = context.targetY ?? caster.y;
        const searchTeam = targetObj ? targetObj.team : caster.team;
        console.log(
            `[DBG-BULLET-HIT] create bullet=${bulletId} uid=${bullet.uid} move=${data.MoveType}` +
            ` caster=${caster.uid}/team${caster.team}` +
            ` target=${targetObj ? `${targetObj.uid}/team${targetObj.team}` : "none"}` +
            ` searchTeam=${searchTeam}` +
            ` from=(${caster.x.toFixed(1)},${caster.y.toFixed(1)})` +
            ` to=(${targetX.toFixed(1)},${targetY.toFixed(1)})`
        );
        const actionEffectScale = this.info.getNumberParam(1, 1);
        bullet.setRange(Math.max(0, Number(data.Range) || 0));
        bullet.setHitActions(bulletInfo.onHitActions, (context.effectScale || 1) * actionEffectScale);

        if (data.MoveType === BulletMoveType.Trace && context.targetId) {
            bullet.initTraceMovement(
                context.casterId,
                context.targetId,
                data.Speed,
                0,
                searchTeam,
                bulletInfo.flyTimeSeconds
            );
        } else {
            bullet.initLineMovement(
                context.casterId,
                targetX,
                targetY,
                data.Speed,
                0,
                searchTeam,
                data.PenetrateCount
            );
        }

        if (data.CheckCollision === false) {
            bullet.configureCollision({
                realtimeCollision: false,
                useTrailCollision: false,
                useRangeCollision: false,
            });
        }
        return 0;
    }
}

registerAction(ActionType.Bullet, BulletAction);
