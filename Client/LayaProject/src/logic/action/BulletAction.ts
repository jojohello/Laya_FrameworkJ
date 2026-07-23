import { BulletMoveType } from "../skill/SkillInfo";
import { SkillMgr } from "../skill/SkillMgr";
import { BulletSceneObj } from "../sceneObj/BulletSceneObj";
import { ActionContext } from "./ActionRuntime";
import { BaseAction } from "./BaseAction";

export class BulletAction extends BaseAction {
    execute(context: ActionContext): void {
        const bulletId = this.info.getNumberParam(0);
        const bulletInfo = SkillMgr.instance.getBullet(bulletId);
        if (!bulletInfo) return;
        const caster = context.scene.getLiveObject(context.casterId);
        if (!caster) return;

        const bullet = context.scene.addObjectToScene(
            "BulletSceneObj",
            bulletId,
            caster.team,
            caster.x,
            caster.y,
            0
        ) as BulletSceneObj | null;
        if (!bullet) return;

        const data = bulletInfo.data;
        const targetX = context.targetX ?? caster.x;
        const targetY = context.targetY ?? caster.y;
        const targetObj = context.targetId ? context.scene.getLiveObject(context.targetId) : null;
        const searchTeam = targetObj ? targetObj.team : caster.team;
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
                data.FlyTime
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
    }
}
