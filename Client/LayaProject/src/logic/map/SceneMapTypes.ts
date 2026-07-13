export type SceneMapType = "image" | "tilemap";

export interface SceneMapConfig {
    type: SceneMapType;
    path: string;
    width?: number;
    height?: number;
    tileWidth?: number;
    tileHeight?: number;
    enableLinear?: boolean;
    limitRange?: boolean;
}

export function inferSceneMapType(path: string, type?: string): SceneMapType {
    const normalizedType = (type || "").toLowerCase();
    if (normalizedType === "tilemap") {
        return "tilemap";
    }
    if (normalizedType === "image") {
        return "image";
    }
    if (normalizedType) {
        console.warn(`[SceneMap] Invalid mapType: ${type}, fallback to path inference`);
    }

    const normalizedPath = (path || "").toLowerCase();
    if (normalizedPath.endsWith(".tmx") || normalizedPath.endsWith(".tmj") || normalizedPath.endsWith(".json")) {
        return "tilemap";
    }

    return "image";
}
