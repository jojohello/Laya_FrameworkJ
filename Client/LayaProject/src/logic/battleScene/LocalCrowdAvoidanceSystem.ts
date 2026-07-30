import { BaseScene } from "../scene/BaseScene";
import { SceneMoveVector } from "../scene/SceneMoveVector";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { MAX_CHARACTER_RANGE } from "../sceneObj/CharacterConfigInfo";

interface AvoidanceState {
    blockerUid: number;
    side: -1 | 1;
}

const DETECTION_SCALE = 1.2;
const MAX_NEIGHBORS = 8;
const EPSILON = 1e-6;

/**
 * Synchronously steers one Run displacement around a same-team unit ahead.
 * It never retains entity references or writes positions itself.
 */
export class LocalCrowdAvoidanceSystem {
    private readonly _candidateIds = new Set<number>();
    private readonly _states = new Map<number, AvoidanceState>();

    resolveMove(
        scene: BaseScene,
        owner: BaseSceneObj,
        desiredDx: number,
        desiredDy: number,
        out: SceneMoveVector = { dx: 0, dy: 0 }
    ): SceneMoveVector {
        const desiredLength = Math.hypot(desiredDx, desiredDy);
        const ownerRange = this.getRange(owner);
        if (desiredLength <= EPSILON || owner.isRelease || owner.isDead || ownerRange <= 0) {
            out.dx = desiredDx;
            out.dy = desiredDy;
            return out;
        }

        const desiredX = desiredDx / desiredLength;
        const desiredY = desiredDy / desiredLength;
        const blocker = this.findForwardBlocker(scene, owner, desiredX, desiredY);
        if (!blocker) {
            this._states.delete(owner.uid);
            out.dx = desiredDx;
            out.dy = desiredDy;
            return out;
        }

        const dx = blocker.x - owner.x;
        const dy = blocker.y - owner.y;
        const distance = Math.max(EPSILON, Math.hypot(dx, dy));
        const combinedRange = ownerRange + this.getRange(blocker);
        const state = this.getState(owner.uid, blocker.uid);
        // Bypass follows a tangent around the actual front blocker.  The stored
        // side keeps clockwise/counter-clockwise selection stable for this pair.
        const lateralX = state.side > 0 ? -dy / distance : dy / distance;
        const lateralY = state.side > 0 ? dx / distance : -dx / distance;

        let lateralWeight: number;
        let forwardWeight: number;
        if (distance < combinedRange * 0.8) {
            // Never back away from the target here.  Reversing the forward
            // component caused near-blocker oscillation and could leave a unit
            // permanently outside its skill range.
            lateralWeight = 0.9;
            forwardWeight = 0.45;
        } else {
            const detectionDistance = combinedRange * DETECTION_SCALE;
            const pressure = Math.max(0, Math.min(1, (detectionDistance - distance) / Math.max(EPSILON, detectionDistance - combinedRange)));
            lateralWeight = 0.35 + pressure * 0.55;
            forwardWeight = 1 - lateralWeight * 0.45;
        }

        const resolvedX = desiredX * forwardWeight + lateralX * lateralWeight;
        const resolvedY = desiredY * forwardWeight + lateralY * lateralWeight;

        const resolvedLength = Math.hypot(resolvedX, resolvedY);
        if (resolvedLength <= EPSILON) {
            out.dx = desiredDx;
            out.dy = desiredDy;
            return out;
        }
        out.dx = resolvedX / resolvedLength * desiredLength;
        out.dy = resolvedY / resolvedLength * desiredLength;
        return out;
    }

    forget(uid: number): void {
        this._states.delete(uid);
        for (const [ownerUid, state] of this._states) {
            if (state.blockerUid === uid) this._states.delete(ownerUid);
        }
    }

    clear(): void {
        this._candidateIds.clear();
        this._states.clear();
    }

    private findForwardBlocker(scene: BaseScene, owner: BaseSceneObj, desiredX: number, desiredY: number): BaseSceneObj | null {
        const ownerRange = this.getRange(owner);
        const searchRange = (ownerRange + MAX_CHARACTER_RANGE) * DETECTION_SCALE;
        const candidateIds = scene.getObjInRangeByTeam(owner.team, owner.x, owner.y, searchRange, this._candidateIds);
        if (!candidateIds) return null;

        let closest: BaseSceneObj | null = null;
        let closestDistanceSq = Number.POSITIVE_INFINITY;
        let handled = 0;
        for (const uid of candidateIds) {
            if (uid === owner.uid || handled >= MAX_NEIGHBORS) continue;
            const candidate = scene.getLiveObject(uid);
            if (!candidate || candidate.isRelease || candidate.isDead || candidate.team !== owner.team
                || candidate.getObjType() !== owner.getObjType() || this.getRange(candidate) <= 0) {
                continue;
            }
            const dx = candidate.x - owner.x;
            const dy = candidate.y - owner.y;
            const distanceSq = dx * dx + dy * dy;
            const combinedRange = ownerRange + this.getRange(candidate);
            if (distanceSq > combinedRange * combinedRange * DETECTION_SCALE * DETECTION_SCALE
                || dx * desiredX + dy * desiredY <= 0) {
                continue;
            }
            handled++;
            if (distanceSq < closestDistanceSq) {
                closest = candidate;
                closestDistanceSq = distanceSq;
            }
        }
        return closest;
    }

    private getState(ownerUid: number, blockerUid: number): AvoidanceState {
        const existing = this._states.get(ownerUid);
        if (existing?.blockerUid === blockerUid) return existing;
        const side: -1 | 1 = (((ownerUid * 73856093) ^ (blockerUid * 19349663)) & 1) === 0 ? -1 : 1;
        const state = { blockerUid, side };
        this._states.set(ownerUid, state);
        return state;
    }

    private getRange(obj: BaseSceneObj): number {
        const range = Number(obj.range);
        return Number.isFinite(range) ? Math.max(0, range) : 0;
    }
}
