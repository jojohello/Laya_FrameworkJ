import { BaseSceneMap } from "./BaseSceneMap";
import { ImageSceneMap } from "./ImageSceneMap";
import { TileSceneMap } from "./TileSceneMap";
import { SceneMapConfig } from "./SceneMapTypes";

export class SceneMapFactory {
    static create(config: SceneMapConfig): BaseSceneMap {
        if (config.type === "tilemap") {
            return new TileSceneMap(config);
        }

        return new ImageSceneMap(config);
    }
}
