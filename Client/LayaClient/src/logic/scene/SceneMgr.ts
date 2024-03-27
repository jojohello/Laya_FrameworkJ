// jojohello 2023/05/23
// 场景管理器，负责场景的切换，一些场景公用的数据，比如时间，地图大小等的传递

import { BaseScene } from "./BaseScene";

export default class SceneMgr{
    private static _instance: SceneMgr = null;
    public static get inst(): SceneMgr {
        if (!SceneMgr._instance) {
            SceneMgr._instance = new SceneMgr();
        }
        return SceneMgr._instance;
    }

    private curScene:BaseScene = null;
}