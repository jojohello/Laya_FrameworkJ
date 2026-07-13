# Scene Map 模块

## 目标

为 Scene 提供 2D 地图能力，支持两种地图：

- 单图地图：一张完整底图，适合主城、静态背景、小型关卡。
- TileMap 地图：基于 `Laya.TiledMap`，适合大地图、分块渲染、对象点位读取。

## 配置入口

地图由 `SceneType` 配置表驱动：

```json
{
  "ID": 1,
  "sceneClass": "MainScene",
  "mapType": "image",
  "map": "map/main.png",
  "uiName": "MainUI"
}
```

字段说明：

| 字段 | 说明 |
|------|------|
| `mapType` | `image` 或 `tilemap`，推荐策划配置使用这个字段 |
| `map` | 地图资源路径，不要带 `assets/` 前缀；例如 `assets/map/map001/map001.png` 在配置里写 `map/map001/map001.png` |
| `mapWidth/mapHeight` | 可选，手动指定地图像素尺寸 |
| `tileWidth/tileHeight` | 可选，TileMap 或逻辑格子尺寸 |
| `enableLinear/limitRange` | 可选，传给 `Laya.TiledMap.createMap` |

## TileMap 资源建议

当前不需要额外引入第三方库，LayaAir 3.3 仍内置 `Laya.TiledMap`。

建议使用 Tiled Map Editor 1.10.x 制作资源，并导出为 JSON 地图文件给 `Laya.TiledMap.createMap()` 使用。制作约定先保持保守：

- 地图方向优先使用 Orthogonal。
- Tile 尺寸建议先用 `32x32` 或 `64x64`，和后续碰撞/寻路网格保持一致。
- Tileset 图片和地图 JSON 放在同一地图目录或相对路径清晰的子目录。
- 对象层建议命名为 `object`，出生点、终点、刷怪点等用 object name 读取。
- 暂不使用复杂插件、无限地图、外部脚本和过深嵌套属性，先确保 Laya 运行时稳定加载。

## 代码入口

- `BaseSceneMap`: 地图基类，统一宽高、tile 尺寸、viewport 和对象点位接口。
- `ImageSceneMap`: 单图地图实现。
- `TileSceneMap`: `Laya.TiledMap` 实现，支持 `getLayerObject()`。
- `SceneMapFactory`: 根据配置创建具体地图。

## 当前接入行为

- `BaseScene.onEnter()` 会根据 `SceneType.map` 自动加载地图。
- 地图加载完成后，`BaseScene` 会用地图尺寸刷新空间分割范围和 Camera2D 边界。
- 每帧 Camera2D 更新后，会同步 TileMap viewport。
- 当前 `SceneType.map` 为空时，行为与旧版本一致，不加载地图。

真实地图、Camera2D 和 HUD 的联合验证属于当前战斗场景工作，统一记录在根目录与 SceneObj 的 `PlanAndStatus.md`，不在本使用文档维护第二份进度。
