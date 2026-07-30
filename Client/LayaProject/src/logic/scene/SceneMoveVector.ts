/** Mutable output supplied by the caller to avoid per-frame movement allocations. */
export interface SceneMoveVector {
    dx: number;
    dy: number;
}
