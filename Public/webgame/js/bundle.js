(function () {
    'use strict';

    class GameConfig {
        constructor() { }
        static init() {
            Laya.ClassUtils.regClass;
        }
    }
    GameConfig.width = 750;
    GameConfig.height = 1334;
    GameConfig.scaleMode = "showall";
    GameConfig.screenMode = "none";
    GameConfig.alignV = "middle";
    GameConfig.alignH = "center";
    GameConfig.startScene = "";
    GameConfig.sceneRoot = "";
    GameConfig.debug = false;
    GameConfig.stat = false;
    GameConfig.physicsDebug = false;
    GameConfig.exportSceneToJson = true;
    GameConfig.init();

    class CfgMgr {
        constructor() {
            this._isInit = false;
            this._useZip = false;
            this._zip = null;
            this._zipFilesContents = new Map();
            this._tableMap = new Map();
            this.File_Path = "res/cfg/";
            this.File_Ext = ".csv";
        }
        static get inst() {
            if (!CfgMgr._instance) {
                CfgMgr._instance = new CfgMgr();
            }
            return CfgMgr._instance;
        }
        init(handle) {
            if (this._useZip) {
                Laya.loader.load(this.File_Path + "cfg.data", Laya.Handler.create(this, (data) => {
                    const arrayBuffer = new Uint8Array(data).buffer;
                    this._zip = new Laya.Browser.window.JSZip();
                    this._zip.loadAsync(arrayBuffer, {}).then((zip) => {
                        Object.keys(this._zip.files);
                        let fileCount = 0;
                        zip.forEach((relativePath, zipEntry) => {
                            if (zipEntry.dir)
                                return;
                            fileCount++;
                            zipEntry.async("string").then((data) => {
                                let fileName = zipEntry.name;
                                let tableName = fileName.substr(0, fileName.length - 4);
                                this._zipFilesContents.set(tableName, data);
                                fileCount--;
                                if (fileCount == 0) {
                                    this._isInit = true;
                                    if (handle)
                                        handle();
                                }
                            });
                        });
                    });
                }), null, Laya.Loader.BUFFER);
            }
            else {
                let csvList = [
                    "res/cfg/Bullet.csv",
                    "res/cfg/Monster.csv",
                    "res/cfg/Skill.csv",
                    "res/cfg/BattleMap.csv",
                    "res/cfg/Producer.csv",
                    "res/cfg/AttrDef.csv",
                ];
                Laya.loader.load(csvList, Laya.Handler.create(this, () => {
                    this._isInit = true;
                    if (handle)
                        handle();
                }));
            }
        }
        getTable(tableName) {
            if (!this._isInit) {
                console.error("CfgMgr.getTable() error, CfgMgr is not init");
                return null;
            }
            let filePath = tableName;
            if (!this._useZip)
                filePath = this.File_Path + filePath + this.File_Ext;
            if (!this._tableMap.has(filePath)) {
                this.initTable(filePath);
            }
            if (!this._tableMap.has(filePath)) {
                console.error("CfgMgr.getTable() error, tableName is not exist", filePath);
                return null;
            }
            return this._tableMap.get(filePath);
        }
        getCfg(tableName, key) {
            let table = this.getTable(tableName);
            if (!table) {
                console.error("CfgMgr.getTableItem() error, tableName is not exist", tableName);
                return null;
            }
            return table.get(key);
        }
        initTable(tablePath) {
            let content = null;
            if (this._useZip) {
                content = this._zipFilesContents.get(tablePath);
            }
            else {
                content = Laya.loader.getRes(tablePath);
            }
            if (!content) {
                console.error("CfgMgr.initTable() error, tableName is not exist", tablePath);
                return;
            }
            let lines = content.split("\n");
            let titles = lines[0].replace("\n", "").replace("\r", "").split(",");
            let types = lines[1].replace("\n", "").replace("\r", "").split(",");
            let map = this.createMap(types);
            let line = "";
            let value = null;
            for (let i = 4; i < lines.length; i++) {
                if (lines[i] == "")
                    continue;
                line = lines[i].replace("\n", "").replace("\r", "");
                value = this.parseValueToMap(line, titles, types);
                map.set(value[titles[1]], value);
            }
            this._tableMap.set(tablePath, map);
            if (this._useZip) {
                this._zipFilesContents.delete(tablePath);
            }
        }
        createMap(types) {
            let keyType = types[1];
            switch (keyType) {
                case "int":
                    return new Map();
                default:
                    return new Map();
            }
        }
        parseValueToMap(line, titles, types) {
            let ret = {};
            let values = line.split(",");
            for (let i = 1; i < titles.length; i++) {
                let title = titles[i];
                let value = values[i];
                let type = types[i];
                switch (type) {
                    case "int":
                        ret[title] = parseInt(value);
                        break;
                    case "str":
                        ret[title] = value;
                        break;
                    case "bool":
                        ret[title] = value == "1" || value.toLowerCase() == "true";
                        break;
                    case "float":
                        ret[title] = parseFloat(value);
                        break;
                }
            }
            return ret;
        }
    }

    class BaseMap {
        constructor() {
            this.tMap = null;
            this.resPath = "";
            this.viewRect = null;
        }
        loadMapRes(mapName, handle) {
            this.resPath = mapName;
            this.tMap = new Laya.TiledMap();
            this.viewRect = new Laya.Rectangle(0, 0, Laya.stage.width, Laya.stage.height);
            this.tMap.createMap(mapName, this.viewRect, Laya.Handler.create(this, () => {
                this.viewRect.width = this.tMap.width * this.tMap.tileWidth;
                this.viewRect.height = this.tMap.height * this.tMap.tileHeight;
                this.tMap.changeViewPort(this.viewRect.x, this.viewRect.y, this.viewRect.width, this.viewRect.height);
                if (handle)
                    handle();
            }));
        }
        getWidth() { return this.tMap.width; }
        getHeight() { return this.tMap.height; }
        getGridHeight() { return this.tMap.tileHeight; }
        getGridWidth() { return this.tMap.tileWidth; }
        getTileWidth() { return this.tMap.tileWidth; }
        getTileHeight() { return this.tMap.tileHeight; }
        getTiledMap() { return this.tMap; }
        getTileMapViewRect() { return this.viewRect; }
    }

    class SceneTime {
        constructor() {
            this.startTime = 0;
            this.timeScale = 1;
            this.passTime = 0;
            this.oldScale = 0;
        }
        start() {
            this.startTime = new Date().getTime();
            this.timeScale = 1;
            this.passTime = 0;
        }
        setScale(scale) {
            if (scale < 0) {
                return;
            }
            if (this.timeScale == scale) {
                return;
            }
            let curTime = new Date().getTime();
            this.passTime = this.passTime + (curTime - this.startTime) * this.timeScale;
            this.startTime = curTime;
            this.timeScale = scale;
        }
        pause() {
            if (this.timeScale <= 0)
                return;
            this.oldScale = this.timeScale;
            this.setScale(0);
        }
        resume() {
            if (this.oldScale <= 0)
                return;
            this.setScale(this.oldScale);
        }
        curTime() {
            let curTime = new Date().getTime();
            return this.passTime + (curTime - this.startTime) * this.timeScale;
        }
    }

    class IDFactory {
        static GetID() {
            IDFactory.GAME_UNIQUE_ID++;
            return IDFactory.GAME_UNIQUE_ID;
        }
    }
    IDFactory.GAME_UNIQUE_ID = 0;

    class MyCacher {
        static getObj(className) {
            if (MyCacher._cacheMap.has(className)
                && MyCacher._cacheMap.get(className).length > 0) {
                return MyCacher._cacheMap.get(className).pop();
            }
            return Laya.ClassUtils.getInstance(className);
        }
        static recycleObj(obj) {
            let className = obj.constructor.name;
            if (!MyCacher._cacheMap.has(className)) {
                MyCacher._cacheMap.set(className, []);
            }
            MyCacher._cacheMap.get(className).push(obj);
        }
    }
    MyCacher._cacheMap = new Map();

    class BaseScene {
        static get curInst() {
            return BaseScene._Inst;
        }
        static set curInst(value) {
            BaseScene._Inst = value;
        }
        static get MapLayer() {
            if (!BaseScene._mapLayer) {
                BaseScene._mapLayer = Laya.stage.getChildByName("mapNode");
                BaseScene._mapLayer.zOrder = 1;
            }
            return BaseScene._mapLayer;
        }
        static get PlayerLayer() {
            if (!BaseScene._playerLayer) {
                BaseScene._playerLayer = Laya.stage.getChildByName("playerNode");
                BaseScene._playerLayer.zOrder = 2;
            }
            return BaseScene._playerLayer;
        }
        constructor() {
            this.mapInst = null;
            this._isMapReady = false;
            this._sceneTime = new SceneTime();
            this.fiexdTime = 0.1;
            this.lastUpdateTime = 0;
            this._collision = null;
            this.objMap = new Map();
            this.delIdList = [];
            this.typeMap = new Map();
            this.tempDelTypeDict = new Map();
            this._sceneTime.start();
            Laya.timer.frameLoop(1, this, this.onFrameLoop);
        }
        loadMap(mapPath, handle) {
            this.mapInst = new BaseMap();
            this.mapInst.loadMapRes(mapPath, () => { this._isMapReady = true; handle(); });
        }
        get FixedTime() {
            return this.fiexdTime;
        }
        set FixedTime(value) {
            this.fiexdTime = value;
        }
        get collision() {
            return this._collision;
        }
        get curTime() {
            return this._sceneTime.curTime();
        }
        onFrameLoop() {
            if (this.isReady() == false)
                return;
            let curTime = this._sceneTime.curTime();
            this.onUpdate(curTime);
            this.onLateUpdate(curTime);
            if (curTime - this.lastUpdateTime > this.fiexdTime) {
                this.onFixedUpdate(curTime);
                this.lastUpdateTime = curTime;
            }
        }
        isReady() {
            if (!this._isMapReady)
                return false;
            return true;
        }
        onUpdate(curTime) {
            for (const obj of this.objMap.values()) {
                if (obj.isRelease)
                    this.delIdList.push(obj.uid);
                else
                    obj.update(curTime);
            }
        }
        onLateUpdate(curTime) {
            for (const obj of this.objMap.values()) {
                if (!obj.isRelease)
                    obj.lateUpdate(curTime);
            }
            this.deleteObjectFromScene();
        }
        onFixedUpdate(curTime) {
            for (const obj of this.objMap.values()) {
                obj.fixedUpdate(curTime);
            }
        }
        deleteObjectFromScene() {
            if (this.delIdList.length === 0) {
                return;
            }
            let delObj = null;
            this.tempDelTypeDict.clear();
            for (const uId of this.delIdList) {
                delObj = this.objMap.get(uId);
                if (delObj !== null && delObj !== undefined) {
                    this.tempDelTypeDict.set(delObj.getObjType(), true);
                    MyCacher.recycleObj(delObj);
                    delObj.onRelease(this);
                    this.objMap.delete(uId);
                }
            }
            let typeIdList = null;
            for (const objType of this.tempDelTypeDict.keys()) {
                typeIdList = this.typeMap.get(objType);
                const count = typeIdList.length;
                let index = 0;
                for (let i = 0; i < count; i++) {
                    if (this.objMap[typeIdList[index]] === null || this.objMap[typeIdList[index]] === undefined) {
                        typeIdList.splice(index, 1);
                        index--;
                    }
                    index++;
                }
            }
            this.delIdList.length = 0;
            delObj = null;
            typeIdList = null;
        }
        addObjectToScene(className, cfgId, team, x, y, angle) {
            const newId = IDFactory.GetID();
            const newObj = MyCacher.getObj(className);
            newObj.init(newId, cfgId, this, team, x, y, angle);
            this.objMap.set(newId, newObj);
            const objType = newObj.getObjType();
            if (this.typeMap[objType] === null || this.typeMap[objType] === undefined) {
                this.typeMap.set(objType, []);
            }
            this.typeMap.get(objType).push(newId);
            return newObj;
        }
        deleteObject(uId) {
            let obj = this.objMap.get(uId);
            if (obj) {
                obj.release();
            }
        }
        getObject(uId) {
            return this.objMap.get(uId) || null;
        }
        getObjectCountOfObjType(objType) {
            if (this.typeMap.has(objType)) {
                return this.typeMap.get(objType).length;
            }
            return 0;
        }
        getTypeUIDs(objType) {
            if (this.typeMap.has(objType)) {
                return this.typeMap.get(objType);
            }
            return null;
        }
    }
    BaseScene._Inst = null;
    BaseScene._mapLayer = null;
    BaseScene._playerLayer = null;

    class MathUtils {
        static deg(radian) {
            return radian * 180 / Math.PI;
        }
        static squareLen(x, y) {
            return x * x + y * y;
        }
        static vectorDiv(x, y, div) {
            if (div > 1e-5 || div < -1e-5) {
                return [x / div, y / div];
            }
            return [0, 0];
        }
        static cross2D(x1, y1) {
            let top = 1;
            return [y1 * top, -x1 * top];
        }
        static dot(x1, y1, x2, y2) {
            return x1 * x2 + y1 * y2;
        }
        static squareDis(x1, y1, x2, y2) {
            return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
        }
        static distance(x1, y1, x2, y2) {
            return Math.sqrt(this.squareDis(x1, y1, x2, y2));
        }
        static lerp(a, b, rate) {
            return a + (b - a) * rate;
        }
        static sin(a) {
            if (this.sinCache.has(a) == false) {
                this.sinCache.set(a, Math.sin(Math.sin(a)));
            }
            return this.sinCache.get[a];
        }
        static cos(a) {
            if (this.cosCache.has(a) == false) {
                this.cosCache.set(a, Math.cos(Math.cos(a)));
            }
            return this.cosCache.get[a];
        }
        static collisionTrailBatchReady(sx, sy, ex, ey, range) {
            let fx = ex - sx;
            let fy = ey - sy;
            let len = this.squareLen(fx, fy);
            this._needSearchLine = true;
            if (len < 1) {
                this._needSearchLine = false;
            }
            if (this._needSearchLine) {
                len = Math.sqrt(len);
                [fx, fy] = this.vectorDiv(fx, fy, len);
                let [rightX, rightY] = this.cross2D(fx, fy);
                this._A_X = sx + rightX * range;
                this._A_Y = sy + rightY * range;
                this._B_X = sx + rightX * -range;
                this._B_Y = sy + rightY * -range;
                this._C_X = this._B_X + fx * len;
                this._C_Y = this._B_Y + fy * len;
                this._AB_X = this._B_X - this._A_X;
                this._AB_Y = this._B_Y - this._A_Y;
                this._BC_X = this._C_X - this._B_X;
                this._BC_Y = this._C_Y - this._B_Y;
                this.dotABAB = this.squareLen(this._AB_X, this._AB_Y);
                this.dotBCBC = this.squareLen(this._BC_X, this._BC_Y);
            }
        }
        static collisionTrailBatch(ex, ey, range, objX, objY, objRange) {
            let isAdd = false;
            if (this._needSearchLine) {
                let _AM_X = objX - this._A_X;
                let _AM_Y = objY - this._A_Y;
                let _BM_X = objX - this._B_X;
                let _BM_Y = objY - this._B_Y;
                let dotABAM = this.dot(this._AB_X, this._AB_Y, _AM_X, _AM_Y);
                let dotBCBM = this.dot(this._BC_X, this._BC_Y, _BM_X, _BM_Y);
                let squareX = 0;
                let squareY = 0;
                if (dotABAM < 0) {
                    squareX = dotABAM * dotABAM / this.dotABAB;
                }
                else if (dotABAM > this.dotABAB) {
                    squareX = dotABAM * dotABAM / this.dotABAB - 2 * dotABAM + this.dotABAB;
                }
                else {
                    squareX = 0;
                }
                if (dotBCBM < 0) {
                    squareY = dotBCBM * dotBCBM / this.dotBCBC;
                }
                else if (dotBCBM > this.dotBCBC) {
                    squareY = dotBCBM * dotBCBM / this.dotBCBC - 2 * dotBCBM + this.dotBCBC;
                }
                else {
                    squareY = 0;
                }
                if (squareX + squareY <= objRange * objRange) {
                    isAdd = true;
                }
            }
            if (!isAdd) {
                let dx = objX - ex;
                let dy = objY - ey;
                if (this.squareLen(dx, dy) <= (range + objRange) * (range + objRange)) {
                    isAdd = true;
                }
            }
            return isAdd;
        }
    }
    MathUtils.sinCache = new Map();
    MathUtils.cosCache = new Map();
    MathUtils.random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
    MathUtils._needSearchLine = false;
    MathUtils._A_X = 0;
    MathUtils._A_Y = 0;
    MathUtils._B_X = 0;
    MathUtils._B_Y = 0;
    MathUtils._C_X = 0;
    MathUtils._C_Y = 0;
    MathUtils._AB_X = 0;
    MathUtils._AB_Y = 0;
    MathUtils._BC_X = 0;
    MathUtils._BC_Y = 0;
    MathUtils.dotABAB = 0;
    MathUtils.dotBCBC = 0;

    var Point = Laya.Point;
    class Transform2D {
        constructor() {
            this._pos = Laya.Point.create();
            this._pos.setTo(0, 0);
            this._forward = Laya.Point.create();
            this._forward.setTo(1, 0);
            this._angle = 0;
            this._offsetX = 0;
            this._offsetY = 0;
            this._angleSpeed = 90;
            this._isPosChange = true;
            this._isAngleChange = true;
            this._isTurning = false;
            this._lastUpdateTime = -1;
        }
        get angle() {
            return this._angle;
        }
        get targetAngle() {
            return this._targetAngle;
        }
        update(curTime) {
            if (curTime - this._lastUpdateTime < Transform2D.deltaTime) {
                return;
            }
            this.updateAngleTween(curTime);
            this._lastUpdateTime = curTime;
        }
        updateAngleTween(curTime) {
            if (this._isTurning == false) {
                return;
            }
            let changeAngle = (curTime - this._startTurnTime) * this._angleSpeed * 0.001;
            if (changeAngle < 0) {
                return;
            }
            if (changeAngle >= this._deltaAngle) {
                changeAngle = this._deltaAngle;
                this._isTurning = false;
            }
            let newAngle = this._startAngle + this._turnLeft * changeAngle;
            this.setAngle(newAngle);
        }
        turnToAngle(targetAngle, curTime) {
            targetAngle = Math.floor(targetAngle + 0.5);
            targetAngle = targetAngle % 360;
            if (this._targetAngle == targetAngle && this._isTurning == true) {
                return;
            }
            if (this._angle == targetAngle && this._isTurning == false) {
                return;
            }
            this._targetAngle = targetAngle;
            this._turnLeft = 1;
            this._startAngle = this._angle;
            this._deltaAngle = this._targetAngle - this._startAngle;
            if (this._deltaAngle < -180) {
                this._deltaAngle = 360 + this._deltaAngle;
            }
            else if (this._deltaAngle < 0) {
                this._deltaAngle = Math.abs(this._deltaAngle);
                this._turnLeft = -1;
            }
            else if (this._deltaAngle > 180) {
                this._deltaAngle = 360 - this._deltaAngle;
                this._turnLeft = -1;
            }
            this._startTurnTime = curTime;
            this._isTurning = true;
        }
        turnToDirection(x, y, curTime) {
            if (MathUtils.squareLen(x, y) < 0.00001) {
                return;
            }
            let targetAngle = MathUtils.deg(Math.atan2(y, x));
            this.turnToAngle(targetAngle, curTime);
        }
        setPos(x, y) {
            if (Math.abs(this._pos.x - x) > 0.0001 || Math.abs(this._pos.y - y) > 0.0001) {
                this._pos.setTo(x, y);
                this._isPosChange = true;
            }
        }
        setAngle(angle) {
            angle = Math.floor(angle + 0.5);
            angle = angle % 360;
            if (this._angle != angle) {
                this._angle = angle;
                this._forward.x = MathUtils.cos(angle);
                this._forward.y = MathUtils.sin(angle);
                this._isAngleChange = true;
            }
        }
        setDir(v) {
            let x = v.x;
            let y = v.y;
            if (MathUtils.squareLen(x, y) < 0.00001) {
                return;
            }
            let angle = MathUtils.deg(Math.atan2(y, x));
            this.setAngle(angle);
        }
        pointTo(x, y) {
            let dir = Point.create();
            dir.setTo(x - this._pos.x, y - this._pos.y);
            this.setDir(dir);
            dir.recover();
        }
        setOffsetX(offsetX) {
            if (this._offsetX != offsetX) {
                this._offsetX = offsetX;
                this._isPosChange = true;
            }
        }
        setOffsetY(offsetY) {
            if (this._offsetY != offsetY) {
                this._offsetY = offsetY;
                this._isPosChange = true;
            }
        }
        setAngleSpeed(angleSpeed) {
            this._angleSpeed = angleSpeed;
        }
        resetPosChange() {
            this._isPosChange = false;
        }
        resetAngleChange() {
            this._isAngleChange = false;
        }
        getPos() {
            let ret = Point.create();
            ret.setTo(this._pos.x, this._pos.y);
            return ret;
        }
        getAngle() {
            return this._angle;
        }
        getForward() {
            let ret = Point.create();
            ret.setTo(this._forward.x, this._forward.y);
            return ret;
        }
        getOffsetX() {
            return this._offsetX;
        }
        getOffsetY() {
            return this._offsetY;
        }
        getIsPosChange() {
            return this._isPosChange;
        }
        getIsAngleChange() {
            return this._isAngleChange;
        }
        get x() {
            return this._pos.x;
        }
        get y() {
            return this._pos.y;
        }
        forceUpdate() {
            this._isAngleChange = true;
            this._isPosChange = true;
        }
    }
    Transform2D.deltaTime = 0.033;

    class BaseSceneObj {
        constructor() {
            this._uid = 0;
            this._cfgId = 0;
            this._cfg = null;
            this._isRelease = false;
            this._teamId = 0;
            this._isDead = false;
            this._model = null;
            this._transform = new Transform2D();
            this._range = 0;
            this._isDebugPos = false;
            this._debugPosSprite = null;
        }
        get uid() {
            return this._uid;
        }
        get isRelease() {
            return this._isRelease;
        }
        init(uid, cfgId, scene, team, x, y, angle) {
            this._isRelease = false;
            this._uid = uid;
            this._cfgId = cfgId;
            this._transform.setPos(x, y);
            this._transform.setAngle(angle);
            this._transform.forceUpdate();
            this._teamId = team;
            this.onInit(uid, cfgId, scene, team, x, y, angle);
            this.loadRes();
        }
        update(curTime) {
        }
        ;
        lateUpdate(curTime) {
            this.confirmPos();
        }
        ;
        fixedUpdate(curTime) { }
        ;
        onInit(uid, cfgId, scene, team, x, y, angle) {
        }
        confirmPos() {
            if (this._model == null)
                return;
            if (this._transform.getIsPosChange()) {
                let pos = this._transform.getPos();
                let tMap = BattleScene.curInst.mapInst.getTiledMap();
                let rect = BattleScene.curInst.mapInst.getTileMapViewRect();
                let screenPoint = Laya.Point.create();
                screenPoint.x = rect.x + (pos.x + this._transform.getOffsetX()) * tMap.scale;
                screenPoint.y = rect.y + (pos.y + this._transform.getOffsetY()) * tMap.scale;
                let newPos = Laya.stage.localToGlobal(screenPoint);
                this._model.pos(newPos.x, newPos.y);
                pos.recover();
                screenPoint.recover();
                this._transform.resetPosChange();
                this.onConfirmPos();
                if (this._isDebugPos && this._range > 0) {
                    if (this._debugPosSprite == null) {
                        this._debugPosSprite = new Laya.Sprite();
                        Laya.stage.addChild(this._debugPosSprite);
                    }
                    this._debugPosSprite.graphics.clear();
                    this._debugPosSprite.graphics.drawCircle(this._transform.x, this._transform.y, this._range, "#008800");
                }
            }
            if (this._transform.getIsAngleChange()) {
                this._model.rotation = this._transform.getAngle();
                this._transform.resetAngleChange();
            }
        }
        onRelease(scene) {
            if (this._debugPosSprite) {
                this._debugPosSprite.graphics.clear();
            }
        }
        getPos() {
            return this._transform.getPos();
        }
        getRange() {
            return this._range;
        }
        getUid() {
            return this._uid;
        }
        onCollision() {
        }
        get x() {
            return this._transform.x;
        }
        get y() {
            return this._transform.y;
        }
        get team() {
            return this._teamId;
        }
        release() {
            this._isRelease = true;
        }
        isDead() {
            return this._isDead;
        }
        getDamage(casterId, damage) {
        }
        getCasterId() {
            return this._uid;
        }
        onConfirmPos() { }
    }

    let SceneObjType = {
        Tower: 1,
        Monster: 2,
        Bullet: 3,
        Effect: 4,
        MonsterCreater: 5,
    };

    const max_round = 8;
    class CreateInfo {
        constructor() {
            this.monsterIds = [];
            this.monsterNums = [];
        }
    }
    class MonsterCreater extends BaseSceneObj {
        constructor() {
            super(...arguments);
            this._startTime = -1;
            this._index = 0;
            this._bornMosterType = 0;
            this._maxRound = 0;
            this._delayTimeList = [];
            this._bornMonsterInfos = [];
            this._isAllCreated = false;
        }
        onInit(uid, cfgId, scene, team, x, y, angle) {
            this._cfg = CfgMgr.inst.getCfg("Producer", this._cfgId);
            for (let i = 1; i <= max_round; i++) {
                let delay = this._cfg["Delay" + i];
                let monsterInfoStr = this._cfg["Born" + i];
                if (monsterInfoStr == "")
                    break;
                this._maxRound = i;
                this._delayTimeList.push(delay * 1000);
                let monsterGroup = monsterInfoStr.split("|");
                let newData = new CreateInfo();
                for (let j = 0; j < monsterGroup.length; j++) {
                    let monsterInfo = monsterGroup[j].split(":");
                    newData.monsterIds.push(parseInt(monsterInfo[0]));
                    newData.monsterNums.push(parseInt(monsterInfo[1]));
                }
                this._bornMonsterInfos.push(newData);
            }
        }
        getObjType() {
            return SceneObjType.MonsterCreater;
        }
        loadRes() {
        }
        start(curTime) {
            this._startTime = curTime;
            this._index = 0;
            this._isAllCreated = false;
        }
        update(curTime) {
            if (this._startTime == -1 || this._isAllCreated) {
                return;
            }
            if (curTime - this._startTime < this._delayTimeList[this._index]) {
                return;
            }
            let info = this._bornMonsterInfos[this._index];
            for (let i = 0; i < info.monsterIds.length; i++) {
                let monsterId = info.monsterIds[i];
                let monsterNum = info.monsterNums[i];
                for (let j = 0; j < monsterNum; j++) {
                    let bornPos = this._transform.getPos();
                    bornPos.x += MathUtils.random(-10, 10) * 5;
                    bornPos.y += MathUtils.random(-10, 10) * 5;
                    BattleScene.curInst.addObjectToScene("Monster", monsterId, this.team, bornPos.x, bornPos.y, 0);
                    bornPos.recover();
                }
            }
            this._index++;
            if (this._index >= this._maxRound) {
                this._isAllCreated = true;
            }
        }
    }

    class BaseState {
        constructor() {
            this._stateName = null;
        }
        getStateName() {
            if (!this._stateName) {
                this._stateName = this.constructor.name.replace("State", "");
            }
            return this._stateName;
        }
        onEnter(owner) { }
        ;
        onUpdate(owner, curTime) { }
        ;
        onExit(owner) { }
        ;
    }
    class StateMachine {
        constructor() {
            this.currentState = null;
            this.stateMap = new Map();
        }
        registerState(state) {
            this.stateMap.set(state.getStateName(), state);
        }
        setState(stateName, owner) {
            if (this.currentState != null) {
                this.currentState.onExit(owner);
            }
            this.currentState = this.stateMap.get(stateName);
            if (this.currentState != null) {
                this.currentState.onEnter(owner);
            }
        }
        update(owner, curTime) {
            if (this.currentState != null) {
                this.currentState.onUpdate(owner, curTime);
            }
        }
        getCurStateName() {
            if (!this.currentState)
                return "";
            return this.currentState.getStateName();
        }
    }

    class StateAttack extends BaseState {
        onUpdate(owner, curTime) {
            if (!owner.curSkillAgent || !owner.curSkillAgent.isRunning) {
                owner.fsm.setState("Idle", owner);
                return;
            }
            owner.curSkillAgent.updateSkill(curTime, owner);
        }
    }

    class StateDead extends BaseState {
        constructor() {
            super(...arguments);
            this._startTime = 0;
        }
        onEnter(owner) {
            this._startTime = BaseScene.curInst.curTime;
        }
        onUpdate(owner, curTime) {
            if (owner.isRelease)
                return;
            let passTime = curTime - this._startTime;
            if (passTime > 1000) {
                owner.release();
            }
        }
    }

    class StateIdle extends BaseState {
    }

    class StateMove extends BaseState {
        onEnter(owner) {
            if (owner.moveAgent.isWorking)
                return;
            owner.moveAgent.start(BaseScene.curInst.curTime);
        }
        ;
        onUpdate(owner, curTime) {
        }
        onExit(owner) {
            owner.moveAgent.stop();
        }
        ;
    }

    class ActorFsmUtils {
        static createMonsterFsm() {
            let ret = new StateMachine();
            ret.registerState(new StateIdle());
            ret.registerState(new StateMove());
            ret.registerState(new StateAttack());
            ret.registerState(new StateDead());
            return ret;
        }
    }

    class ResBaseProxy {
        static get instance() {
            if (ResBaseProxy._instance == null) {
                ResBaseProxy._instance = new ResBaseProxy();
            }
            return ResBaseProxy._instance;
        }
        load(url, complete, error) {
            Laya.loader.load(url, complete);
        }
        onLoadComplete(url) {
        }
        onLoadError(url) {
        }
        clearRes(url) {
            Laya.loader.clearRes(url);
        }
    }
    ResBaseProxy._instance = new ResBaseProxy();
    class ResBase {
        constructor(url) {
            this._resReady = false;
            this._buildResHandler = null;
            this._pivotX = 0;
            this._pivotY = 0;
            this._rotation = 0;
            this._url = url;
        }
        setParent(parent) {
            parent.addChild(this._res);
        }
        registerBuildResHandler(hander) {
            this._buildResHandler = hander;
        }
        clearBuildResHandler() {
            if (this._buildResHandler != null) {
                this._buildResHandler.recover();
                this._buildResHandler = null;
            }
        }
        afterBuildRes() {
            if (this._buildResHandler != null) {
                this._buildResHandler.run();
            }
        }
        initTransform() {
            if (this._res == null)
                return;
            this._res.pos(this._x, this._y);
            this._res.pivot(this._pivotX, this._pivotY);
            this._res.rotation = this._rotation;
        }
        setScale(scaleX, scaleY) {
            if (this._res == null)
                return;
            this._res.scaleX = scaleX;
            this._res.scaleY = scaleY;
        }
        localToGlobal(pos) {
            if (this._res == null) {
                pos.setTo(0, 0);
                return pos;
            }
            return this._res.localToGlobal(pos);
        }
        get url() {
            return this._url;
        }
        pos(x, y) {
            this._x = x;
            this._y = y;
            if (this._res != null) {
                this._res.pos(x, y);
            }
        }
        pivot(x, y) {
            this._pivotX = x;
            this._pivotY = y;
            if (this._res != null) {
                this._res.pivot(x, y);
            }
        }
        getBounds() {
            let refInfo = ResManager$1.instance.getRefInfo(this._url);
            return refInfo ? refInfo.bounds : null;
        }
        set rotation(v) {
            this._rotation = v;
            if (this._res != null) {
                this._res.rotation = v;
            }
        }
    }

    class ResAtlasAnimProxy extends ResBaseProxy {
        static get instance() {
            if (ResAtlasAnimProxy._myInstance == null) {
                ResAtlasAnimProxy._myInstance = new ResAtlasAnimProxy();
            }
            return ResAtlasAnimProxy._myInstance;
        }
        onLoadComplete(url) {
            this.createFrameAnimModel(url, "moveB", 8);
            this.createFrameAnimModel(url, "moveC", 8);
            this.createFrameAnimModel(url, "moveE", 8);
            this.createFrameAnimModel(url, "moveF", 8);
            this.createFrameAnimModel(url, "moveH", 8);
            this.createFrameAnimModel(url, "moveI", 8);
            this.createFrameAnimModel(url, "moveK", 8);
            this.createFrameAnimModel(url, "moveL", 8);
        }
        createFrameAnimModel(url, animName, length) {
            let end = url.indexOf(".atlas");
            let altasName = url.substring(0, end);
            let animList = [];
            for (let i = 0; i < length; i++) {
                animList.push(altasName + "/" + animName + i + ".png");
            }
            let graphics = Laya.Animation.createFrames(animList, animName);
            if (graphics.length > 0) {
                let _resInfo = ResManager$1.instance.getRefInfo(url);
                if (_resInfo != null && _resInfo.bounds == null) {
                    _resInfo.bounds = graphics[0].getBounds();
                }
            }
        }
        clearRes(url) {
            Laya.loader.clearRes(url);
        }
    }
    ResAtlasAnimProxy._myInstance = null;
    class ResAtlasAnim extends ResBase {
        constructor() {
            super(...arguments);
            this._animHeader = "";
        }
        buildRes() {
            if (this._res == null) {
                this._res = new Laya.Animation();
                this._res.atlas = Laya.Loader.getAtlas(this._url);
            }
            Laya.stage.addChild(this._res);
            this._res.visible = true;
            if (this._animName != null && this._animName != "") {
                this.play(this._animName, this._isLoop, true);
            }
        }
        play(aniName, isLoop, force) {
            aniName = "moveB";
            isLoop = true;
            if (this._animName == aniName && !force && isLoop)
                return;
            this._animName = aniName;
            this._isLoop = isLoop;
            if (this._res == null)
                return;
            this._res.play(0, isLoop, this._animHeader + this._animName);
        }
        onRecycle() {
            if (this._res == null)
                return;
            this._res.stop();
            this._res.visible = false;
            this._res.removeSelf();
        }
        onDispose() {
            this._res.stop();
            this._res.removeSelf();
            this._res.destroy();
            this._res = null;
        }
    }

    class ResNativeSpineProxy extends ResBaseProxy {
        constructor() {
            super(...arguments);
            this._templetDict = new Map();
        }
        static get instance() {
            if (ResNativeSpineProxy._myInstance == null) {
                ResNativeSpineProxy._myInstance = new ResNativeSpineProxy();
            }
            return ResNativeSpineProxy._myInstance;
        }
        load(url, complete, error) {
            let templet = this._templetDict.get(url);
            if (templet != null) {
                return;
            }
            templet = new Laya.Templet();
            this._templetDict.set(url, templet);
            templet.on(Laya.Event.COMPLETE, this, () => { complete === null || complete === void 0 ? void 0 : complete.run(); });
            templet.on(Laya.Event.ERROR, this, () => { error === null || error === void 0 ? void 0 : error.run(); });
            templet.loadAni(url);
        }
        onLoadError(url) {
            this._templetDict.delete(url);
        }
        clearRes(url) {
            let __templete = this._templetDict.get(url);
            if (__templete == null)
                return;
            this._templetDict.delete(url);
            __templete.destroy();
            __templete = null;
        }
        buildRes(url) {
            let __templete = this._templetDict.get(url);
            if (__templete == null)
                return null;
            return __templete.buildArmature(0);
        }
    }
    ResNativeSpineProxy._myInstance = null;
    class ResNativeSpine extends ResBase {
        constructor() {
            super(...arguments);
            this._loadHander = null;
            this._animHeader = "";
        }
        buildRes() {
            if (this._res == null) {
                this._res = ResNativeSpineProxy.instance.buildRes(this._url);
            }
            if (this._res == null)
                return;
            Laya.stage.addChild(this._res);
            this._res.pos(this._x, this._y);
            this._res.visible = true;
            if (this._animName != null && this._animName != "") {
                this.play(this._animName, this._isLoop, true);
            }
        }
        play(aniName, isLoop, force) {
            if (this._animName == aniName && !force && isLoop)
                return;
            this._animName = aniName;
            this._isLoop = isLoop;
            if (this._res == null)
                return;
            this._res.play(this._animName, isLoop);
        }
        onRecycle() {
            if (this._res == null)
                return;
            this._res.stop();
            this._res.visible = false;
            this._res.removeSelf();
        }
        onDispose() {
            this._res.stop();
            this._res.removeSelf();
            this._res.destroy();
            this._res = null;
        }
    }

    class ResTimelingAnimProxy extends ResBaseProxy {
        static get instance() {
            if (ResTimelingAnimProxy._myInstance == null) {
                ResTimelingAnimProxy._myInstance = new ResTimelingAnimProxy();
            }
            return ResTimelingAnimProxy._myInstance;
        }
        load(url, complete, error) {
            let atlasUrl = ["res/atlas/" + url.replace(".ani", ".atlas"), url];
            Laya.loader.load(atlasUrl, complete);
        }
        clearRes(url) {
            Laya.loader.clearRes("res/atlas/" + url.replace(".ani", ".atlas"));
            Laya.loader.clearRes(url);
            Laya.Animation.clearCache(url);
        }
    }
    ResTimelingAnimProxy._myInstance = null;
    class ResTimelineAnim extends ResBase {
        buildRes() {
            if (this._res == null) {
                this._res = new Laya.Animation();
                this._res.loadAnimation(this._url);
            }
            Laya.stage.addChild(this._res);
            this._res.visible = true;
            if (this._animName != null && this._animName != "") {
                this.play(this._animName, this._isLoop, true);
            }
        }
        play(aniName, isLoop, force) {
            if (this._animName == aniName && !force && isLoop)
                return;
            this._animName = aniName;
            this._isLoop = isLoop;
            if (this._res == null)
                return;
            this._res.play(0, isLoop, this._animName);
        }
        onRecycle() {
            if (this._res == null)
                return;
            this._res.stop();
            this._res.visible = false;
            this._res.removeSelf();
        }
        onDispose() {
            this._res.stop();
            this._res.removeSelf();
            this._res.destroy();
            this._res = null;
        }
    }

    class RefInfo {
        constructor() {
            this.refCount = 0;
            this.lastUseTime = 0;
            this.proxy = null;
            this.bounds = null;
        }
    }
    const CACHE_TIME = 100;
    class ResManager {
        constructor() {
            this._refInfoDict = new Map();
            this._cacheResDict = new Map();
            this._resStateDict = new Map();
            this._loadingResDict = new Map();
            this.__tempCacheList = null;
            this.__tempDelUrlList = [];
            this.__tempResInfo = null;
        }
        static get instance() {
            if (ResManager._instance == null) {
                ResManager._instance = new ResManager();
                Laya.timer.loop(300, ResManager._instance, ResManager._instance.update);
            }
            return ResManager._instance;
        }
        getRefInfo(url) {
            return this._refInfoDict.get(url);
        }
        recoverRes(res) {
            if (res == null) {
                return;
            }
            this.__tempCacheList = this._cacheResDict.get(res.url);
            if (this.__tempCacheList == null) {
                this.__tempCacheList = [];
            }
            this.subRefCounter(res.url);
            this.__tempCacheList.push(res);
            res.clearBuildResHandler();
            res.onRecycle();
            this._cacheResDict.set(res.url, this.__tempCacheList);
        }
        update() {
            for (let [url, refInfo] of this._refInfoDict) {
                if (refInfo.refCount > 0) {
                    continue;
                }
                if (Date.now() - refInfo.lastUseTime < CACHE_TIME) {
                    continue;
                }
                this.__tempCacheList = this._cacheResDict.get(url);
                for (let i = 0; i < this.__tempCacheList.length; i++) {
                    this.__tempCacheList[i].onDispose();
                }
                this._cacheResDict.delete(url);
                this._resStateDict.delete(url);
                this._loadingResDict.delete(url);
                refInfo.proxy.clearRes(url);
                this.__tempDelUrlList.push(url);
                if (Laya.stage.getTimeFromFrameStart() > 32) {
                    break;
                }
            }
            if (this.__tempDelUrlList.length > 0) {
                for (let i = 0; i < this.__tempDelUrlList.length; i++) {
                    this._refInfoDict.delete(this.__tempDelUrlList[i]);
                }
                this.__tempDelUrlList.length = 0;
            }
        }
        getNativeSpine(url, onBuildResHandler) {
            return this.getRes(url, ResNativeSpine, ResNativeSpineProxy.instance, onBuildResHandler);
        }
        getAltasAnim(url, onBuildResHandler) {
            return this.getRes(url, ResAtlasAnim, ResAtlasAnimProxy.instance, onBuildResHandler);
        }
        getTimelineAnim(url, onBuildResHandler) {
            return this.getRes(url, ResTimelineAnim, ResTimelingAnimProxy.instance, onBuildResHandler);
        }
        getRes(url, classType, resProxy, onBuildResHandler) {
            this.addRefCounter(url, resProxy);
            this.__tempCacheList = this._cacheResDict.get(url);
            if (this.__tempCacheList != null && this.__tempCacheList.length > 0) {
                let ret = this.__tempCacheList.pop();
                ret.registerBuildResHandler(onBuildResHandler);
                ret.buildRes();
                ret.initTransform();
                Laya.timer.frameOnce(1, this, function () { ret.afterBuildRes(); });
                return ret;
            }
            let res = new classType(url);
            res.registerBuildResHandler(onBuildResHandler);
            let resState = this._resStateDict.get(url);
            if (resState == null || resState == 0) {
                resProxy.load(url, Laya.Handler.create(this, this.onLoadComplete, [url, resProxy]));
                this._resStateDict.set(url, 1);
                this._loadingResDict.set(url, [res]);
            }
            else if (resState == 1) {
                this._loadingResDict.get(url).push(res);
            }
            else {
                res.buildRes();
                res.initTransform();
                Laya.timer.frameOnce(1, this, function () { res.afterBuildRes(); });
            }
            return res;
        }
        onLoadComplete(url, proxy) {
            if (this._resStateDict.get(url) == null) {
                return;
            }
            this._resStateDict.set(url, 2);
            proxy.onLoadComplete(url);
            for (let res of this._loadingResDict.get(url)) {
                res.buildRes();
                res.initTransform();
                Laya.timer.frameOnce(1, this, function () { res.afterBuildRes(); });
            }
            this._loadingResDict.delete(url);
        }
        addRefCounter(url, proxy = null) {
            this.__tempResInfo = this._refInfoDict.get(url);
            if (this.__tempResInfo == null) {
                this.__tempResInfo = new RefInfo();
                this.__tempResInfo.proxy = proxy;
            }
            this.__tempResInfo.refCount++;
            this.__tempResInfo.lastUseTime = Date.now();
            this._refInfoDict.set(url, this.__tempResInfo);
            this.__tempResInfo = null;
        }
        subRefCounter(url) {
            this.__tempResInfo = this._refInfoDict.get(url);
            if (this.__tempResInfo == null) {
                return;
            }
            this.__tempResInfo.refCount--;
            this.__tempResInfo.lastUseTime = Date.now();
            this._refInfoDict.set(url, this.__tempResInfo);
            this.__tempResInfo = null;
        }
    }
    ResManager._instance = null;
    var ResManager$1 = ResManager;

    class MyUtils {
        static strEndWith(str, endStr) {
            let d = str.length - endStr.length;
            str.lastIndexOf(endStr);
            return (d >= 0 && str.lastIndexOf(endStr) == d);
        }
    }

    class Attribute {
        constructor() {
            this._datas = [];
            this._baseDatas = [];
            this._addDatas = [];
            if (Attribute.nameDict == null) {
                Attribute.initAttrNameDict();
            }
            this._datas = new Array(Attribute.nameDict.size);
            this._baseDatas = new Array(Attribute.nameDict.size);
            this._addDatas = new Array(Attribute.nameDict.size);
            this._datas.fill(0);
            this._baseDatas.fill(0);
            this._addDatas.fill(0);
        }
        static initAttrNameDict() {
            let cfgTable = CfgMgr.inst.getTable("AttrDef");
            let haveRateList = [];
            Attribute.nameDict = new Map();
            for (const [id, config] of cfgTable) {
                Attribute.nameDict.set(config["name"], config["ID"] - 1);
                if (MyUtils.strEndWith(config["name"], "Rate")) {
                    haveRateList.push(config["name"]);
                }
            }
            let rateAttrName = "";
            let baseAttrName = "";
            Attribute.baseDict = new Map();
            Attribute.rateDict = new Map();
            for (let i = 0; i < haveRateList.length; i++) {
                rateAttrName = haveRateList[i];
                baseAttrName = rateAttrName.replace("Rate", "");
                if (!Attribute.nameDict.has(baseAttrName) || !Attribute.nameDict.has(rateAttrName)) {
                    console.error("属性表，存在不配对的百分比属性：" + rateAttrName);
                    continue;
                }
                Attribute.baseDict.set(baseAttrName, Attribute.nameDict.get(rateAttrName));
                Attribute.rateDict.set(rateAttrName, Attribute.nameDict.get(baseAttrName));
            }
        }
        caculateAttr(name) {
            let index = Attribute.nameDict.get(name);
            if (index == null)
                return;
            let ret = this._baseDatas[index] + this._addDatas[index];
            if (Attribute.rateDict.has(name)) {
                let baseIndex = Attribute.rateDict.get(name);
                this.setAttr(index, ret);
                this.setAttr(baseIndex, (this._baseDatas[baseIndex] + this._addDatas[baseIndex]) * (1 + this._datas[index] * 0.0001));
            }
            else if (Attribute.baseDict.has(name)) {
                let rateIndex = Attribute.baseDict.get(name);
                this.setAttr(index, ret * (1 + this._datas[rateIndex] * 0.0001));
            }
            else {
                this.setAttr(index, ret);
            }
        }
        setBaseAttr(name, v) {
            let index = Attribute.nameDict.get(name);
            if (index == null)
                return;
            this._baseDatas[index] = v;
            this.caculateAttr(name);
        }
        getIndex(name) {
            let ret = Attribute.nameDict.get(name);
            if (ret == null)
                return -1;
            return ret;
        }
        addAttr(name, v) {
            let index = Attribute.nameDict.get(name);
            if (index == null)
                return;
            this._addDatas[index] += v;
            this.caculateAttr(name);
        }
        getAttr(name) {
            let index = Attribute.nameDict.get(name);
            if (index == null)
                return 0;
            return this._datas[index];
        }
        setAttr(index, v) {
            if (index < 0 || index >= this._datas.length)
                return;
            let oldValue = this._datas[index];
            this._datas[index] = v;
            this.OnAttrChange(index, oldValue, v);
        }
        clear() {
            this._datas.fill(0);
            this._baseDatas.fill(0);
            this._addDatas.fill(0);
        }
        OnAttrChange(index, oldValue, newValue) {
        }
    }
    Attribute.nameDict = null;
    Attribute.rateDict = null;
    Attribute.baseDict = null;

    class BaseView {
        constructor() {
            this._isRelease = false;
            this._view = null;
            this._isShown = false;
            this._x = 0;
            this._y = 0;
            this._events = null;
        }
        isShown() {
            return this._isShown;
        }
        show() {
            if (this._isRelease) {
                return;
            }
            if (!this._view) {
                this._isShown = true;
                fgui.UIPackage.loadPackage("res/UI/" + this.getPackageName(), Laya.Handler.create(this, () => {
                    if (this._isRelease)
                        return;
                    this._view = fgui.UIPackage.createObject(this.getPackageName(), this.getViewName()).asCom;
                    this.onViewLoaded();
                    fgui.GRoot.inst.addChild(this._view);
                    this._view.setXY(this._x, this._y);
                    if (this._isShown) {
                        this._view.visible = true;
                        this.onShown();
                        this.registerEvent();
                    }
                    else {
                        this._view.visible = false;
                    }
                }));
            }
            else if (!this._isShown) {
                this._isShown = true;
                this._view.visible = true;
                this.onShown();
                this.registerEvent();
            }
        }
        hide() {
            if (!this._isShown)
                return;
            this._isShown = false;
            if (this._view) {
                this._view.visible = false;
                this.unregisterEvent();
            }
            this.onHide();
        }
        onShown() {
        }
        onHide() {
        }
        onViewLoaded() {
        }
        registerEvent() {
            if (!this._events)
                return;
            for (const [id, callback] of this._events) {
                Laya.EventEmitter.inst.on(id, callback);
            }
        }
        unregisterEvent() {
            if (!this._events)
                return;
            for (const [id, callback] of this._events) {
                Laya.EventEmitter.inst.off(id, callback);
            }
        }
        release() {
            this._isRelease = true;
            this.hide();
            if (this._view) {
                this._view.dispose();
                this._view = null;
                this.onDisposeView();
            }
        }
        onDisposeView() {
        }
        recover() {
            if (this._isRelease) {
                this._isRelease = false;
            }
            if (this._view) {
                this._view.dispose();
                this._view = null;
            }
        }
        setPosByGlobal(x, y) {
            this._x = x;
            this._y = y;
            if (this._view) {
                let newPos = Laya.Point.create();
                this._view.parent.globalToLocal(x, y, newPos);
                this._view.setXY(newPos.x, newPos.y);
                newPos.recover();
            }
        }
    }

    class JumpWordView extends BaseView {
        constructor() {
            super(...arguments);
            this._count = 0;
        }
        getPackageName() {
            return "SceneObj";
        }
        getViewName() {
            return "jumpWord";
        }
        static play(x, y, count) {
            if (JumpWordView._isRegister == false) {
                Laya.ClassUtils.regClass("JumpWordView", JumpWordView);
            }
            let newView = MyCacher.getObj("JumpWordView");
            newView.recover();
            newView.setPosByGlobal(x, y);
            newView.setCount(count);
            newView.show();
        }
        onShown() {
            this.setPosByGlobal(this._x, this._y);
            this._view.words.text = this._count.toString();
            this._view.popAnim.play();
            Laya.timer.once(2000, this, () => {
                this.hide();
                this.release();
                MyCacher.recycleObj(this);
            });
        }
        setCount(count) {
            this._count = count;
            if (this._view) {
                this._view.words.text = count.toString();
            }
        }
    }
    JumpWordView._isRegister = false;

    class MonsterHudView extends BaseView {
        constructor() {
            super(...arguments);
            this._team = 0;
            this._process = 1;
        }
        getPackageName() {
            return "SceneObj";
        }
        getViewName() {
            if (this._team == BaseScene.curInst.selfTeam)
                return "selfBlood";
            else
                return "enemyBlood";
        }
        onShown() {
            this.setBloodProcess(this._process);
            this.setPosByGlobal(this._x, this._y);
        }
        setTeam(team) {
            this._team = team;
        }
        setBloodProcess(rate) {
            this._process = rate;
            if (this._view) {
                this._view.blood.fillAmount = rate;
            }
        }
    }

    class Monster extends BaseSceneObj {
        constructor() {
            super();
            this._agent = null;
            this._attr = null;
            this._fsm = null;
            this._hudPosX = 0;
            this._hudPosY = 0;
            this._hud = null;
            this._attr = new Attribute();
        }
        get fsm() {
            return this._fsm;
        }
        get moveAgent() {
            return this._agent;
        }
        getObjType() {
            return SceneObjType.Monster;
        }
        loadRes() {
            this._model = ResManager$1.instance.getAltasAnim(this._cfg.model, Laya.Handler.create(this, this.onLoadModel));
        }
        onLoadModel() {
            this._model.play();
            let bounds = this._model.getBounds();
            this._transform.setOffsetX(-bounds.width);
            this._transform.setOffsetY(-bounds.height);
            if (this._hud == null)
                this._hud = new MonsterHudView();
            else
                this._hud.recover();
            this._hud.setTeam(this.team);
            this._hud.show();
            this._hud.setBloodProcess(this._attr.getAttr("HP") / this._attr.getAttr("maxHP"));
            this._hudPosX = bounds.width;
            this.confirmHudPos();
        }
        onInit(uid, cfgId, scene, team, x, y, angle) {
            this._cfg = CfgMgr.inst.getCfg("Monster", this._cfgId);
            this._range = 20;
            this._isDebugPos = true;
            this._isDead = false;
            let battleScene = scene;
            this._agent = battleScene.createMoveAgent(this.x, this.y, 1, this._cfg.speed);
            this._agent.stop();
            if (!this._fsm) {
                this._fsm = ActorFsmUtils.createMonsterFsm();
            }
            this._fsm.setState("Move", this);
            this.initAttribute();
        }
        onConfirmPos() {
            this.confirmHudPos();
        }
        onRelease(scene) {
            super.onRelease(scene);
            let battleScene = scene;
            battleScene.removeMoveAgent(this._agent.uid);
            this._agent = null;
            ResManager$1.instance.recoverRes(this._model);
            if (this._hud) {
                this._hud.release();
            }
            this._attr.clear();
        }
        update(curTime) {
            super.update(curTime);
            this._fsm.update(this, curTime);
            if (this._agent != null) {
                this._transform.setPos(this._agent.x, this._agent.y);
            }
        }
        confirmHudPos() {
            if (!this._hud)
                return;
            let pos = Laya.Point.create();
            pos.setTo(this._hudPosX, this._hudPosY);
            this._model.localToGlobal(pos);
            this._hud.setPosByGlobal(pos.x, pos.y);
            pos.recover();
        }
        getDamage(casterId, damage) {
            let curHp = this._attr.getAttr("HP");
            let trueDamage = damage;
            curHp -= damage;
            if (curHp < 0) {
                curHp = 0;
                trueDamage = this._attr.getAttr("HP");
            }
            this._attr.setAttr(this._attr.getIndex("HP"), curHp);
            if (this._hud != null)
                this._hud.setBloodProcess(this._attr.getAttr("HP") / this._attr.getAttr("maxHP"));
            if (curHp <= 0) {
                this._isDead = true;
                this._fsm.setState("Dead", this);
            }
            let pos = Laya.Point.create();
            pos.setTo(0, -50);
            this._model.localToGlobal(pos);
            JumpWordView.play(pos.x, pos.y, -trueDamage);
            pos.recover();
        }
        initAttribute() {
            this._attr.setBaseAttr("maxHP", this._cfg.hp);
            this._attr.setAttr(this._attr.getIndex("HP"), this._cfg.hp);
        }
        get curState() {
            return this._fsm.getCurStateName();
        }
        run() {
            this._fsm.setState("Move", this);
        }
    }

    class PotentialPath {
        constructor(tMap) {
            this._width = 0;
            this._height = 0;
            this._gridSize = 0;
            this._canWalkMap = null;
            this._potentialMap = null;
            this._agentMap = new Map();
            this._targetPos = new Laya.Point().setTo(0, 0);
            this.MAX_POTENTIAL = 999999;
            this._width = tMap.numColumnsTile;
            this._height = tMap.numRowsTile;
            this._potentialMap = new Array(this._width * this._height);
            this._canWalkMap = new Array(this._width * this._height);
            this._gridSize = tMap.tileWidth;
            let layer = tMap.getLayerByName("collision");
            for (let i = 0; i < this._canWalkMap.length; i++) {
                let pos = this.index2GridPos(i);
                this._canWalkMap[i] = layer.getTileData(pos.x, pos.y) > 0;
                pos.recover();
            }
            let tEndPoint = tMap.getLayerObject("object", "endPoint");
            this.setTargetPos(tEndPoint.x, tEndPoint.y);
        }
        getPotentialValue(gridX, gridY) {
            let index = this.gridPos2Index(gridX, gridY);
            if (index < 0)
                return this.MAX_POTENTIAL;
            return this._potentialMap[index];
        }
        getTargetPos() {
            return Laya.Point.create().setTo(this._targetPos.x, this._targetPos.y);
        }
        get gridSize() {
            return this._gridSize;
        }
        pos2GridPos(x, y) {
            let gridX = Math.floor(x / this._gridSize);
            let gridY = Math.floor(y / this._gridSize);
            return Laya.Point.create().setTo(gridX, gridY);
        }
        gridPos2Index(x, y) {
            if (x < 0 || x >= this._width || y < 0 || y >= this._height)
                return -1;
            return x + y * this._width;
        }
        gridPos2Pos(x, y) {
            let posX = x * this._gridSize + this._gridSize / 2;
            let posY = y * this._gridSize + this._gridSize / 2;
            return Laya.Point.create().setTo(posX, posY);
        }
        index2GridPos(index) {
            let x = index % this._width;
            let y = Math.floor(index / this._width);
            let ret = Laya.Point.create();
            ret.setTo(x, y);
            return ret;
        }
        pos2Index(x, y) {
            let gridX = Math.floor(x / this._gridSize);
            let gridY = Math.floor(y / this._gridSize);
            return this.gridPos2Index(gridX, gridY);
        }
        addAgent(uid, agent) {
            this._agentMap.set(uid, agent);
        }
        removeAgent(uid) {
            this._agentMap.delete(uid);
        }
        setTargetPos(x, y) {
            this._targetPos.setTo(x, y);
            for (let i = 0; i < this._potentialMap.length; i++) {
                this._potentialMap[i] = this.MAX_POTENTIAL;
            }
            let index = this.pos2Index(x, y);
            let curProtenial = 0;
            this._potentialMap[index] = curProtenial;
            let openStack = [];
            let startPoint = Laya.Point.create().setTo(Math.floor(x / this._gridSize), Math.floor(y / this._gridSize));
            openStack.push(startPoint);
            let closeMap = new Map();
            while (openStack.length > 0) {
                curProtenial++;
                let openCount = openStack.length;
                for (; openCount > 0; openCount--) {
                    let curPoint = openStack.shift();
                    let gridX = curPoint.x;
                    let gridY = curPoint.y;
                    let curIndex = this.gridPos2Index(gridX, gridY);
                    closeMap.set(curIndex, true);
                    for (let i = -1; i <= 1; i++)
                        for (let j = -1; j <= 1; j++) {
                            if (i == 0 && j == 0) {
                                continue;
                            }
                            if (Math.abs(i) == 1 && Math.abs(j) == 1) {
                                continue;
                            }
                            let newX = gridX + i;
                            let newY = gridY + j;
                            if (newX < 0 || newX >= this._width || newY < 0 || newY >= this._height)
                                continue;
                            let newIndex = this.gridPos2Index(newX, newY);
                            if (closeMap.has(newIndex)) {
                                continue;
                            }
                            let newPoint = Laya.Point.create().setTo(newX, newY);
                            if (openStack.find((value, index, obj) => { return value.x == newPoint.x && value.y == newPoint.y; })) {
                                newPoint.recover();
                                continue;
                            }
                            if (this._canWalkMap[newIndex]) {
                                this._potentialMap[newIndex] = curProtenial;
                                openStack.push(newPoint);
                            }
                            else {
                                this._potentialMap[newIndex] = this.MAX_POTENTIAL;
                                closeMap.set(newIndex, true);
                                newPoint.recover();
                            }
                        }
                    curPoint.recover();
                }
            }
        }
        update(curTime) {
            for (let agent of this._agentMap.values()) {
                agent.updatePos(curTime, this);
            }
        }
    }

    class PathFindAgent {
        constructor(uid, x, y, radius = 1, speed, team = -1) {
            this._uid = 0;
            this._x = 0;
            this._y = 0;
            this._speed = 0;
            this._radius = 1;
            this._lastUpdateTime = 0;
            this._team = 0;
            this._uid = uid;
            this._x = x;
            this._y = y;
            this._radius;
            this._speed = speed;
            this._team = team;
        }
        get isWorking() {
            return this._isWorking;
        }
        start(curTime) {
            this._isWorking = true;
            this._lastUpdateTime = curTime;
        }
        stop() {
            this._isWorking = false;
        }
        setSpeed(speed) {
            this._speed = speed;
        }
        get uid() {
            return this._uid;
        }
        get x() {
            return this._x;
        }
        get y() {
            return this._y;
        }
        getPos() {
            return Laya.Point.create().setTo(this._x, this._y);
        }
        setPos(x, y) {
            this._x = x;
            this._y = y;
        }
        updatePos(curTime, pathFinder) {
            if (this.isWorking == false)
                return;
            let targetPos = pathFinder.getTargetPos();
            if (Math.abs(this._x - targetPos.x) < 0.01 && Math.abs(this._y - targetPos.y) < 0.01) {
                targetPos.recover();
                return;
            }
            let deltaTime = curTime - this._lastUpdateTime;
            let moveDistance = this._speed * deltaTime * 0.001;
            if (moveDistance < 0.1)
                return;
            this._lastUpdateTime = curTime;
            if (moveDistance > pathFinder.gridSize * 0.5) {
                moveDistance = pathFinder.gridSize * 0.5;
            }
            if (MathUtils.squareLen(this._x - targetPos.x, this._y - targetPos.y) < moveDistance * moveDistance) {
                this._x = targetPos.x;
                this._y = targetPos.y;
                targetPos.recover();
                return;
            }
            let dir = Laya.Point.create().setTo(0, 0);
            let gridPos = pathFinder.pos2GridPos(this._x, this._y);
            let targetGridPos = pathFinder.pos2GridPos(targetPos.x, targetPos.y);
            if (gridPos.x == targetGridPos.x && gridPos.y == targetGridPos.y) {
                dir.setTo(targetPos.x - this._x, targetPos.y - this._y);
                dir.normalize();
            }
            else {
                let minP = 999999;
                for (let i = -1; i <= 1; i++)
                    for (let j = -1; j <= 1; j++) {
                        if (i == 0 && j == 0)
                            continue;
                        let p = pathFinder.getPotentialValue(gridPos.x + i, gridPos.y + j);
                        if (p < minP) {
                            minP = p;
                            dir.setTo(i, j);
                        }
                    }
                if (dir.x == 0 && dir.y == 0) {
                    gridPos.recover();
                    targetGridPos.recover();
                    targetPos.recover();
                    dir.recover();
                    return;
                }
                let dirTargetPos = pathFinder.gridPos2Pos(gridPos.x + dir.x, gridPos.y + dir.y);
                dir.setTo(dirTargetPos.x - this._x, dirTargetPos.y - this._y);
                dir.normalize();
            }
            targetGridPos.recover();
            gridPos.recover();
            targetPos.recover();
            this._x = this._x + dir.x * moveDistance;
            this._y = this._y + dir.y * moveDistance;
            dir.recover();
        }
    }

    class SkillAgent {
        get targetId() {
            return this._targetId;
        }
        get targetPos() {
            return this._targetPos;
        }
        constructor(config) {
            this._targetPos = new Laya.Point();
            this.initialize(config);
        }
        initialize(config) {
            this._id = config["ID"];
            this._baseId = config["BaseID"];
            this._level = config["Level"];
            this._cd = config["CD"] * 1000;
            this._actionList = config["Action"];
            this._lastCastTime = 0;
            this._isRunning = false;
            this._index = 0;
        }
        stop() {
            this._isRunning = false;
            this._index = 0;
        }
        isReady(curTime) {
            let isCD = this._lastCastTime + this._cd > curTime;
            return !(this._isRunning || isCD);
        }
        castSkill(targetId, x, y, curTime) {
            this._isRunning = true;
            this._lastCastTime = curTime;
            this._targetId = targetId;
            this._targetPos.setTo(x, y);
        }
        get isRunning() {
            return this._isRunning;
        }
        updateSkill(curTime, caster) {
            let deltaTime = curTime - this._lastCastTime;
            let count = this._actionList.length;
            let action = null;
            for (let i = this._index; i < count; i++) {
                action = this._actionList[i];
                if (deltaTime >= action.delay) {
                    action.excute(caster, this, curTime);
                    this._index++;
                }
                else {
                    break;
                }
            }
            if (this._index >= count) {
                this.stop();
            }
        }
        getSkillLevel() {
            return this._level;
        }
    }

    class BaseAction {
        constructor() {
            this._delay = 0;
        }
        get delay() {
            return this._delay;
        }
        set delay(value) {
            this._delay = value;
        }
        parseParams(paramList, startIndex) {
            return startIndex;
        }
    }

    class BulletAction extends BaseAction {
        constructor() {
            super(...arguments);
            this.cfgId = -1;
            this.damageRate = 1;
        }
        parseParams(paramList, startIndex) {
            this.cfgId = parseInt(paramList[startIndex]);
            startIndex++;
            this.damageRate = parseFloat(paramList[startIndex]);
            startIndex++;
            return startIndex;
        }
        excute(caster, agent, curTime) {
            let newBullet = BattleScene.curInst.addObjectToScene("Bullet", this.cfgId, caster.team, caster.x, caster.y, 0);
            newBullet.initMovement(caster.uid, agent.targetId, agent.targetPos.x, agent.targetPos.y, 0, 0);
        }
    }

    class DamageAction extends BaseAction {
        parseParams(paramList, startIndex) {
            return startIndex;
        }
        excute(caster, agent, curTime) {
        }
    }

    class TrueDamageAction extends BaseAction {
        constructor() {
            super(...arguments);
            this._damage = 0;
        }
        parseParams(paramList, startIndex) {
            this._damage = parseFloat(paramList[startIndex]);
            startIndex++;
            return startIndex;
        }
        excute(caster, agent, curTime) {
            let target = BaseScene.curInst.getObject(agent.targetId);
            if (target && target.isDead() == false) {
                target.getDamage(caster.getCasterId(), this._damage);
            }
        }
    }

    class ActionUtils {
        static registerActions() {
            Laya.ClassUtils.regClass("DamageAction", DamageAction);
            Laya.ClassUtils.regClass("BulletAction", BulletAction);
            Laya.ClassUtils.regClass("TrueDamageAction", TrueDamageAction);
        }
        static parseActions(paramStr, withDelay = false) {
            let ret = [];
            let actionStrList = paramStr.split("|");
            for (let i = 0; i < actionStrList.length; i++) {
                let newAction = ActionUtils.parseSingleAction(actionStrList[i], withDelay);
                if (newAction) {
                    ret.push(newAction);
                }
            }
            ret.sort((a, b) => {
                return a.delay - b.delay;
            });
            return ret;
        }
        static parseSingleAction(str, withDelay = false) {
            let paramList = str.split(";");
            let delay = 0;
            let actionName = "";
            let startIndex = 0;
            if (withDelay) {
                delay = Number(paramList[0]);
                actionName = paramList[1];
                startIndex = 2;
            }
            else {
                actionName = paramList[0];
                startIndex = 1;
            }
            let action = Laya.ClassUtils.getInstance(actionName + "Action");
            if (!action) {
                console.error("action not found:", actionName, " from paramStr:", str);
                return null;
            }
            action.delay = delay;
            action.parseParams(paramList, startIndex);
            return action;
        }
    }

    class SkillUtils {
        static preloadSkillConfig() {
            let table = CfgMgr.inst.getTable("Skill");
            for (const [id, config] of table) {
                let baseId = config["BaseID"];
                let level = config["Level"];
                if (!SkillUtils._skillDefDict.has(baseId)) {
                    SkillUtils._skillDefDict.set(baseId, []);
                }
                let levelList = SkillUtils._skillDefDict.get(baseId);
                if (levelList.length >= level) {
                    levelList[level - 1] = config["ID"];
                }
                else {
                    for (let i = levelList.length; i < level; i++) {
                        if (i == level - 1) {
                            levelList.push(config["ID"]);
                        }
                        else {
                            levelList.push(-1);
                        }
                    }
                }
            }
            this._isProloaded = true;
        }
        static prebuildActions(config) {
            if (config["prased"])
                return;
            let actionList = config["Action"];
            config["Action"] = ActionUtils.parseActions(actionList, true);
            config["prased"] = true;
        }
        static getCfgById(id) {
            let config = CfgMgr.inst.getCfg("Skill", id);
            if (!config) {
                return null;
            }
            SkillUtils.prebuildActions(config);
            return config;
        }
        static getCfgByBaseId(baseId, level) {
            if (SkillUtils._isProloaded == false) {
                SkillUtils.preloadSkillConfig();
            }
            let skillId = SkillUtils._skillDefDict.get(baseId)[level - 1];
            if (!skillId || skillId == -1) {
                return null;
            }
            let config = CfgMgr.inst.getCfg("Skill", skillId);
            SkillUtils.prebuildActions(config);
            return config;
        }
    }
    SkillUtils._skillDefDict = new Map();
    SkillUtils._isProloaded = false;

    class ActorSkill {
        constructor() {
            this._skillDict = new Map();
        }
        addSkill(baseId, level) {
            let config = SkillUtils.getCfgByBaseId(baseId, level);
            let oldSkillAgent = this._skillDict.get(baseId);
            if (oldSkillAgent != undefined) {
                let oldLevel = oldSkillAgent.getSkillLevel();
                let newLevel = config["Level"];
                if (newLevel > oldLevel) {
                    oldSkillAgent.initialize(config);
                    return;
                }
            }
            let newSkillAgent = new SkillAgent(config);
            this._skillDict.set(baseId, newSkillAgent);
        }
        deleteSkill(baseId) {
            if (this._skillDict.get(baseId) == undefined) {
                return;
            }
            this._skillDict.get(baseId);
            this._skillDict.delete(baseId);
        }
        getSkillAgent(baseId) {
            return this._skillDict.get(baseId);
        }
        castSkill(baseId, targetId, x, y, curTime) {
            let skillAgent = this._skillDict.get(baseId);
            if (skillAgent == undefined) {
                return null;
            }
            if (skillAgent.isReady(curTime) == false) {
                return null;
            }
            skillAgent.castSkill(targetId, x, y, curTime);
            return skillAgent;
        }
        clear() {
            this._skillDict.clear();
        }
    }

    class Tower extends BaseSceneObj {
        constructor() {
            super(...arguments);
            this._skills = null;
            this._loader = null;
            this._normalSkillId = -1;
            this._curSkillAgent = null;
            this._lastAiTime = 0;
            this._aiDeltaTime = 100;
            this._tempAttackDis = 200;
        }
        onInit(uid, cfgId, scene, team, x, y, angle) {
            this.initSkill();
        }
        getObjType() {
            return SceneObjType.Tower;
        }
        loadRes() {
            if (this._model == null) {
                this._model = new Laya.Sprite();
            }
            Laya.stage.addChild(this._model);
            this._transform.forceUpdate();
            this._cfg = CfgMgr.inst.getCfg("Monster", this._cfgId);
            this._loader = Laya.loader.load(this._cfg.model, Laya.Handler.create(this, this.onLoadModel));
        }
        onLoadModel() {
            this._loader = null;
            let texture = Laya.loader.getRes(this._cfg.model);
            let image = Laya.Pool.getItemByClass("Laya.Image", Laya.Image);
            image.source = texture;
            this._model.addChild(image);
            image.x = -texture.width * 0.5;
            image.y = -texture.height * 0.5;
            image.angle = 0;
            image.scale(1, 1);
            if (this._isDebugPos) {
                if (!this._debugPosSprite) {
                    this._debugPosSprite = new Laya.Sprite();
                }
                Laya.stage.addChild(this._debugPosSprite);
                this._debugPosSprite.graphics.drawCircle(this.x, this.y, this._tempAttackDis, "#ff0000");
                this._debugPosSprite.graphics.drawRect(this.x, this.y, texture.width, texture.height, "#00ff00");
            }
        }
        initSkill() {
            let selfCfg = CfgMgr.inst.getCfg("Monster", this._cfgId);
            let skillIds = selfCfg["skillList"].split("|");
            this._skills = new ActorSkill();
            for (let i = 0; i < skillIds.length; i++) {
                if (skillIds[i] == "")
                    continue;
                if (i == 0)
                    this._normalSkillId = parseInt(skillIds[i]);
                this._skills.addSkill(parseInt(skillIds[i]), 1);
            }
        }
        tryNormalAttack(target, curTime) {
            if (target == null)
                return;
            if (this._skills == null)
                return;
            let targetObj = BaseScene.curInst.getObject(target.uid);
            this._curSkillAgent = this._skills.castSkill(this._normalSkillId, target.uid, targetObj ? targetObj.x : this.x, targetObj ? targetObj.y : this.y, curTime);
        }
        update(curTime) {
            super.update(curTime);
            this._transform.update(curTime);
            this.updataAi(curTime);
            if (this._curSkillAgent) {
                this._curSkillAgent.updateSkill(curTime, this);
                if (this._curSkillAgent.isRunning == false)
                    this._curSkillAgent = null;
            }
        }
        onRelease(scene) {
            if (this._loader) {
                this._loader.cancelLoadByUrl(this._cfg.model);
                this._loader = null;
            }
            if (this._model) {
                Laya.Pool.recover("Laya.Image", this._model);
                this._model = null;
            }
        }
        updataAi(curTime) {
            if (curTime - this._lastAiTime < this._aiDeltaTime)
                return;
            this._lastAiTime = curTime;
            let enemyIds = BaseScene.curInst.collision.getObjInRange(this.x, this.y, this._tempAttackDis);
            if (!enemyIds)
                return;
            let target = null;
            let curTarget = null;
            let minDis = -1;
            let sqrDis = -1;
            enemyIds.forEach((curId) => {
                if (curId == this._uid)
                    return;
                target = BaseScene.curInst.getObject(curId);
                if (!target)
                    return;
                if (target.getObjType() != SceneObjType.Monster)
                    return;
                if (target.isDead())
                    return;
                sqrDis = MathUtils.squareDis(this.x, this.y, target.x, target.y);
                if (sqrDis > this._tempAttackDis * this._tempAttackDis)
                    return;
                if (minDis == -1 || minDis > sqrDis) {
                    minDis = sqrDis;
                    curId = target.uid;
                    curTarget = target;
                }
            });
            if (curTarget) {
                if (this._isDebugPos) {
                    this._debugPosSprite.graphics.clear();
                    this._debugPosSprite.graphics.drawLine(this.x, this.y, curTarget.x, curTarget.y, "#0000ff");
                }
                this._transform.turnToDirection(curTarget.x - this.x, curTarget.y - this.y, curTime);
            }
            else {
                this._transform.turnToAngle(0, curTime);
            }
            if (Math.abs(this._transform.targetAngle - this._transform.angle) < 3) {
                this.tryNormalAttack(curTarget, curTime);
            }
        }
    }

    class SceneCollision {
        constructor() {
            this._scale = 0.0125;
            this._hashMap = null;
            this._lastUpdateTime = -1;
            this._delta = 0.1;
            this._isDebug = true;
            this._debugSprite = null;
        }
        setMapSize(width, height, _scale) {
            this._width = width;
            this._height = height;
            this._scale = _scale || this._scale;
            this._maxX = Math.ceil(width * this._scale);
            this._maxY = Math.ceil(height * this._scale);
            if (this._hashMap) {
                this.clear();
            }
            else {
                this._hashMap = new Map();
            }
        }
        hash(x, y) {
            if (x < 0 || x > this._width || y < 0 || y > this._height) {
                return -1;
            }
            return Math.ceil(x * this._scale) + Math.ceil(y * this._scale) * this._maxX;
        }
        clear() {
            this._hashMap.clear();
        }
        update(curTime, objDict) {
            if (this._lastUpdateTime > 0 && curTime - this._lastUpdateTime < this._delta) {
                return;
            }
            this._lastUpdateTime = curTime;
            this.setCollisionMap(objDict);
        }
        setCollisionMap(objDict) {
            if (!this._hashMap) {
                this._hashMap = new Map();
            }
            else {
                this.clear();
            }
            for (const obj of objDict.values()) {
                if (obj.getObjType() != SceneObjType.Monster) {
                    continue;
                }
                this.setCollision(obj.x, obj.y, obj.getRange(), obj.uid);
            }
        }
        setCollision(x, y, range, id) {
            const hashX = this.toHashIndex(x);
            if (hashX > this._maxX) {
                return;
            }
            const hashY = this.toHashIndex(y);
            if (hashY > this._maxY) {
                return;
            }
            let lx, rx, ty, by;
            lx = this.toHashIndex(x - range);
            rx = this.toHashIndex(x + range);
            ty = this.toHashIndex(y - range);
            by = this.toHashIndex(y + range);
            lx = lx < 1 ? 1 : lx;
            rx = rx > this._maxX ? this._maxX : rx;
            ty = ty < 1 ? 1 : ty;
            by = by > this._maxY ? this._maxY : by;
            for (let ix = lx; ix <= rx; ix++) {
                for (let iy = ty; iy <= by; iy++) {
                    const hashId = iy * this._maxX + ix;
                    if (!this._hashMap.has(hashId)) {
                        this._hashMap.set(hashId, []);
                    }
                    this._hashMap.get(hashId).push(id);
                }
            }
        }
        toHashIndex(f) {
            return Math.ceil(f * this._scale);
        }
        toHashRangeIndex(range) {
            return Math.floor(range * this._scale);
        }
        toPos(index) {
            index % this._maxX;
            Math.floor(index / this._maxX);
        }
        getObjInRange(x, y, range) {
            if (!this._hashMap) {
                return null;
            }
            const hashX = this.toHashIndex(x);
            if (hashX < 0 || hashX > this._maxX) {
                return null;
            }
            const hashY = this.toHashIndex(y);
            if (hashY < 0 || hashY > this._maxY) {
                return null;
            }
            let retSet = new Set();
            let hashId = 0;
            let lx, rx, ty, by;
            lx = this.toHashIndex(x - range);
            rx = this.toHashIndex(x + range);
            ty = this.toHashIndex(y - range);
            by = this.toHashIndex(y + range);
            lx = lx < 1 ? 1 : lx;
            rx = rx > this._maxX ? this._maxX : rx;
            ty = ty < 1 ? 1 : ty;
            by = by > this._maxY ? this._maxY : by;
            for (let ix = lx; ix <= rx; ix++) {
                for (let iy = ty; iy <= by; iy++) {
                    hashId = iy * this._maxX + ix;
                    const itemList = this._hashMap.get(hashId);
                    if (itemList && itemList.length > 0) {
                        for (let i = 0; i < itemList.length; i++) {
                            retSet.add(itemList[i]);
                        }
                    }
                }
            }
            return retSet;
        }
        getObjInRect(x1, y1, x2, y2, range) {
            if (!this._hashMap) {
                return null;
            }
            let lx, rx, ty, by;
            lx = this.toHashIndex(Math.min(x1, x2) - range);
            rx = this.toHashIndex(Math.max(x1, x2) + range);
            ty = this.toHashIndex(Math.min(y1, y2) - range);
            by = this.toHashIndex(Math.max(y1, y2) + range);
            lx = lx < 1 ? 1 : lx;
            rx = rx > this._maxX ? this._maxX : rx;
            ty = ty < 1 ? 1 : ty;
            by = by > this._maxY ? this._maxY : by;
            let retSet = new Set();
            let hashId = 0;
            for (let ix = lx; ix <= rx; ix++) {
                for (let iy = ty; iy <= by; iy++) {
                    hashId = iy * this._maxX + ix;
                    const itemList = this._hashMap.get(hashId);
                    if (itemList && itemList.length > 0) {
                        for (let i = 0; i < itemList.length; i++) {
                            retSet.add(itemList[i]);
                        }
                    }
                }
            }
            return retSet;
        }
    }

    class BaseCondition {
    }

    class ConditionEnemy extends BaseCondition {
        isFit(caster, target) {
            if (target == null)
                return false;
            return caster.team != target.team;
        }
    }

    class ConditionObjType extends BaseCondition {
        constructor(needType) {
            super();
            this._count = 0;
            this._needType = needType;
        }
        isFit(caster, target) {
            if (target == null)
                return false;
            return this._needType == target.getObjType();
        }
    }

    class ConditionAlive extends BaseCondition {
        isFit(caster, target) {
            if (target == null)
                return false;
            if (target["isDead"] == null)
                return false;
            return target.isDead() == false;
        }
    }

    const BulletMoveType = {
        Line: 1,
        Trace: 2,
    };
    class Bullet extends BaseSceneObj {
        constructor() {
            super(...arguments);
            this._startTime = 0;
            this._lastUpdateTime = -1;
            this._startPos = Laya.Point.create();
            this._endPos = Laya.Point.create();
            this._lastPos = Laya.Point.create();
            this._startYOffset = 0;
            this._endYOffset = 0;
            this._curYOffset = 0;
            this._painSprite = null;
            this._collisionContions = [];
            this._collisionIDsSet = new Set();
            this._targetPos = new Laya.Point();
            this._collisionIdList = [];
        }
        get targetId() {
            return this._targetId;
        }
        get targetPos() {
            return this._targetPos;
        }
        getObjType() {
            return SceneObjType.Bullet;
        }
        onInit(uid, cfgId, scene, team, x, y, angle) {
            this._startPos.setTo(x, y);
            this._lastPos.setTo(x, y);
            this._range = 10;
            this._cfg = CfgMgr.inst.getCfg("Bullet", cfgId);
            this._speed = this._cfg.Speed;
            this._needCheckCollision = this._cfg.CheckCollis;
            switch (this._cfg.MoveType) {
                case "Line":
                    this._moveType = BulletMoveType.Line;
                    break;
                case "Trace":
                    this._moveType = BulletMoveType.Trace;
                    break;
                default:
                    console.error("Error bullet move type : " + this._cfg.MoveType);
                    break;
            }
            this._startTime = -1;
            this._lastUpdateTime = -1;
            if (this._collisionContions.length <= 0) {
                this._collisionContions.push(new ConditionEnemy());
                this._collisionContions.push(new ConditionAlive());
                this._collisionContions.push(new ConditionObjType(SceneObjType.Monster));
            }
            this._collisionIDsSet.clear();
        }
        loadRes() {
            if (!this._painSprite) {
                this._painSprite = new Laya.Sprite();
            }
            Laya.stage.addChild(this._painSprite);
            this._model = ResManager$1.instance.getTimelineAnim("effect/base_fly_fire.ani", Laya.Handler.create(this, this.onResLoaded));
            this._model.play("ani1", true, true);
        }
        onResLoaded() {
            this._model.setScale(0.3, 0.3);
        }
        update(curTime) {
            if (this._isRelease)
                return;
            super.update(curTime);
            if (this._lastUpdateTime < 0) {
                this._startTime = curTime;
                this._lastUpdateTime = curTime;
            }
            else {
                let ret = this.updateMovement(curTime);
                if (ret && this._needCheckCollision)
                    this.collision(curTime);
            }
            if (this._flyTime > 0 && curTime - this._startTime > this._flyTime) {
                this.finish(false);
            }
            this._painSprite.graphics.clear();
            this._painSprite.graphics.drawCircle(this.x, this.y + this._curYOffset, this._range, "#555555");
        }
        collision(curTime) {
            this._collisionIdList.length = 0;
            let startPoint = this._transform.getPos();
            let sx = startPoint.x;
            let sy = startPoint.y;
            let endPoint = this._lastPos;
            let ex = endPoint.x;
            let ey = endPoint.y;
            let collisionIdList = BaseScene.curInst.GetTrailCollision(this, ex, ey, sx, sy, this._range, this._collisionContions);
            for (let i = 0; i < collisionIdList.length; i++) {
                if (this._collisionIDsSet.has(collisionIdList[i]))
                    continue;
                this._collisionIdList.push(collisionIdList[i]);
            }
            if (this._collisionIdList.length <= 0) {
                return;
            }
            let targetObj = null;
            for (let i = 0; i < this._collisionIdList.length; i++) {
                let targetId = collisionIdList[i];
                targetObj = BaseScene.curInst.getObject(targetId);
                if (!targetObj) {
                    continue;
                }
                let targetPos = targetObj.getPos();
                this.doHitAction({ ["targetId"]: targetId, ["targetPos"]: targetPos });
                targetPos.recover();
                this._collisionIDsSet.add(this._collisionIdList[i]);
                if (this._collisionIDsSet.size > this._cfg.PenetrateCount) {
                    this.finish(false);
                    targetObj = null;
                    return;
                }
            }
            targetObj = null;
        }
        onRelease(scene) {
            super.onRelease(scene);
            if (this._painSprite) {
                this._painSprite.graphics.clear();
            }
            if (this._model) {
                ResManager$1.instance.recoverRes(this._model);
                this._model = null;
            }
        }
        initMovement(casterId, tarageId, targetX, targetY, startYOffset, endYOffset) {
            this._casterId = casterId;
            this._targetId = tarageId;
            this._endPos.setTo(targetX, targetY);
            this._startYOffset = startYOffset;
            this._endYOffset = endYOffset;
            this._curYOffset = startYOffset;
            if (this._cfg.IsTimeLimit) {
                this._flyTime = this._cfg.LimitTime * 1000;
                if (this._moveType == BulletMoveType.Line) {
                    let deltaX = this._endPos.x - this.x;
                    let deltaY = this._endPos.y - this.y;
                    let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    deltaX = deltaX / distance * this._speed * this._flyTime * 0.001;
                    deltaY = deltaY / distance * this._speed * this._flyTime * 0.001;
                    this._endPos.setTo(this.x + deltaX, this.y + deltaY);
                    this._transform.pointTo(this._endPos.x, this._endPos.y);
                }
            }
            else if (this._moveType == BulletMoveType.Line) {
                let distance = MathUtils.distance(this.x, this.y, this._endPos.x, this._endPos.y);
                this._flyTime = distance / this._speed * 1000;
                if (this._flyTime < 15) {
                    if (this._cfg.CheckCollis) {
                        this.collision(BaseScene.curInst.curTime);
                    }
                    this.finish(false);
                }
                else {
                    this._transform.pointTo(this._endPos.x, this._endPos.y);
                }
            }
            else {
                this._flyTime = -1;
            }
        }
        updateMovement(curTime) {
            switch (this._moveType) {
                case BulletMoveType.Line:
                    let rate = Math.min((curTime - this._startTime) / this._flyTime, 1);
                    let x = MathUtils.lerp(this._startPos.x, this._endPos.x, rate);
                    let y = MathUtils.lerp(this._startPos.y, this._endPos.y, rate);
                    this._curYOffset = MathUtils.lerp(this._startYOffset, this._endYOffset, rate);
                    this._lastPos.setTo(this.x, this.y);
                    this._transform.setPos(x, y);
                    break;
                case BulletMoveType.Trace:
                    let target = BattleScene.curInst.getObject(this._targetId);
                    if (!target) {
                        this.finish(false);
                        return false;
                    }
                    if (this._flyTime > 0) {
                        let rate = Math.min((curTime - this._startTime) / this._flyTime, 1);
                        let x = MathUtils.lerp(this._startPos.x, target.x, rate);
                        let y = MathUtils.lerp(this._startPos.y, target.y, rate);
                        this._lastPos.setTo(this.x, this.y);
                        this._transform.setPos(x, y);
                    }
                    else {
                        let deltaTime = curTime - this._lastUpdateTime;
                        let distance = this._speed * (curTime - this._lastUpdateTime) * 0.001;
                        if (distance < 1 && deltaTime < 100) {
                            return false;
                        }
                        this._lastUpdateTime = curTime;
                        let dirPoint = Laya.Point.create();
                        dirPoint.setTo(target.x - this.x, target.y - this.y);
                        if (MathUtils.squareLen(dirPoint.x, dirPoint.y) <= distance * distance) {
                            this._transform.setPos(target.x, target.y);
                            this.finish(true);
                            return true;
                        }
                        let dirLen = Math.sqrt(dirPoint.x * dirPoint.x + dirPoint.y * dirPoint.y);
                        this._transform.setPos(this.x + dirPoint.x / dirLen * distance, this.y + dirPoint.y / dirLen * distance);
                        this._transform.setDir(dirPoint);
                        dirPoint.recover();
                    }
                    break;
            }
            return true;
        }
        doHitAction(targetInfo) {
            this._targetPos.setTo(this.x, this.y);
            Bullet.prebuildActions(this._cfg);
            let actionList = this._cfg["HitActions"];
            let curTime = BaseScene.curInst.curTime;
            for (let i = 0; i < actionList.length; i++) {
                actionList[i].excute(this, targetInfo ? targetInfo : this, curTime);
            }
        }
        static prebuildActions(config) {
            if (config["prased"])
                return;
            let actionList = config["HitAction"];
            config["HitActions"] = ActionUtils.parseActions(actionList, false);
            config["prased"] = true;
        }
        finish(needAction) {
            if (this._isRelease)
                return;
            if (needAction) {
                this.doHitAction();
            }
            this.release();
        }
    }

    class BattleScene extends BaseScene {
        constructor(cfgId) {
            super();
            this._cfg = null;
            this._mapLayer = null;
            this._floorLayer = null;
            this._playerLayer = null;
            this._startPos = null;
            this._endPos = null;
            this._monsterCreator = null;
            this._pathFinder = null;
            this._selfTeam = 1;
            this._lastPosCalTime = 0;
            this._posCalDelta = 33;
            this._collision_ret_ID_List = [];
            ActionUtils.registerActions();
            Laya.ClassUtils.regClass("Monster", Monster);
            Laya.ClassUtils.regClass("MonsterCreater", MonsterCreater);
            Laya.ClassUtils.regClass("Tower", Tower);
            Laya.ClassUtils.regClass("Bullet", Bullet);
            this._cfg = CfgMgr.inst.getCfg("BattleMap", cfgId);
            if (!this._cfg) {
                console.error("BattleScene.constructor() error, cfg is null", cfgId);
            }
            BaseScene.curInst = this;
            this.loadMap(this._cfg.respath, () => { this.afterMapLoaded(); });
        }
        afterMapLoaded() {
            let tMap = this.mapInst.getTiledMap();
            this.mapInst.getTileMapViewRect();
            this.selfTeam = 1;
            for (let i = 1; i <= 1; i++) {
                let tObj = tMap.getLayerObject("object", "tower_" + i);
                if (!tObj) {
                    continue;
                }
                this.addObjectToScene("Tower", 1, 1, tObj.x, tObj.y, 0);
            }
            let tStartPoint = tMap.getLayerObject("object", "startPoint");
            this._monsterCreator = this.addObjectToScene("MonsterCreater", 1, 2, tStartPoint.x, tStartPoint.y, 0);
            this._monsterCreator.start(this._sceneTime.curTime());
            let tEndPoint = tMap.getLayerObject("object", "endPoint");
            this._endPos = Laya.Point.create();
            this._endPos.x = tEndPoint.x;
            this._endPos.y = tEndPoint.y;
            this._pathFinder = new PotentialPath(tMap);
            this._collision = new SceneCollision();
            this._collision.setMapSize(this.mapInst.getWidth(), this.mapInst.getHeight());
        }
        get MapLayer() {
            if (!this._mapLayer) {
                this._mapLayer = Laya.stage.getChildByName("mapNode");
            }
            return this._mapLayer;
        }
        get FloorLayer() {
            if (!this._floorLayer) {
                this._floorLayer = Laya.stage.getChildByName("floorNode");
            }
            return this._floorLayer;
        }
        get PlayerLayer() {
            if (!this._playerLayer) {
                this._playerLayer = Laya.stage.getChildByName("playerNode");
            }
            return this._playerLayer;
        }
        get selfTeam() {
            return this._selfTeam;
        }
        set selfTeam(value) {
            this._selfTeam = value;
        }
        logic2Stage(p) {
            let ret = Laya.Point.create();
            ret.x = p.x * 32;
            ret.y = p.y * 32;
            return ret;
        }
        createMoveAgent(x, y, radius, speed) {
            let agent = new PathFindAgent(IDFactory.GetID(), x, y, radius, speed);
            this._pathFinder.addAgent(agent.uid, agent);
            return agent;
        }
        removeMoveAgent(uid) {
            this._pathFinder.removeAgent(uid);
        }
        onUpdate(curTime) {
            super.onUpdate(curTime);
            if (this._monsterCreator) {
                this._monsterCreator.update(curTime);
            }
            if (curTime - this._lastPosCalTime > this._posCalDelta) {
                this._lastPosCalTime = curTime;
                this._pathFinder.update(curTime);
            }
            this.collision.update(curTime, this.objMap);
        }
        GetTrailCollision(master, startX, startY, endX, endY, range, conditions) {
            this._collision_ret_ID_List.length = 0;
            let idsSet = this._collision.getObjInRect(startX, startY, endX, endY, range);
            if (idsSet == null || idsSet.size == 0) {
                idsSet = null;
                return this._collision_ret_ID_List;
            }
            MathUtils.collisionTrailBatchReady(startX, startY, endX, endY, range);
            let obj = null;
            idsSet.forEach((uid) => {
                obj = this.objMap.get(uid);
                if (conditions != null && conditions.length > 0) {
                    for (let i = 0; i < conditions.length; i++) {
                        if (!conditions[i].isFit(master, obj)) {
                            return;
                        }
                    }
                }
                let objPos = obj.getPos();
                let objX = objPos.x;
                let objY = objPos.y;
                let objRange = obj.getRange();
                if (MathUtils.collisionTrailBatch(endX, endY, range, objX, objY, objRange)) {
                    this._collision_ret_ID_List.push(uid);
                }
                objPos.recover();
            });
            obj = null;
            this._collision_ret_ID_List.sort((aid, bid) => {
                let a = this.objMap.get(aid).getPos();
                let ax = a.x;
                let ay = a.y;
                a.recover();
                let b = this.objMap.get(bid).getPos();
                let bx = b.x;
                let by = b.y;
                b.recover();
                return MathUtils.squareDis(ax, ay, startX, startY) - MathUtils.squareDis(bx, by, startX, startY);
            });
            return this._collision_ret_ID_List;
        }
    }

    class LogicMain {
        constructor() {
            this.ani = null;
        }
        static get inst() {
            if (!LogicMain._instance) {
                LogicMain._instance = new LogicMain();
            }
            return LogicMain._instance;
        }
        init() {
            CfgMgr.inst.init(() => {
                let scene = new BattleScene(1);
                let keyDownFun = (event) => {
                    if (event.keyCode == Laya.Keyboard.A) {
                        let monsterList = scene.getTypeUIDs(SceneObjType.Monster);
                        if (monsterList == null || monsterList.length == 0)
                            return;
                        let bullet = scene.addObjectToScene("Bullet", 1, 1, 100, 100, 0);
                        bullet.initMovement(-1, monsterList[0], 200, 200, 0, 0);
                    }
                };
                Laya.stage.on(Laya.Event.KEY_DOWN, this, keyDownFun);
            });
        }
        isInit() {
            return true;
        }
    }

    class EventEmitter {
        constructor() {
            this.events = new Map();
        }
        static get inst() {
            if (!EventEmitter._instance) {
                EventEmitter._instance = new EventEmitter();
            }
            return EventEmitter._instance;
        }
        on(eventName, handler) {
            const handlers = this.events.get(eventName) || [];
            handlers.push(handler);
            this.events.set(eventName, handlers);
        }
        off(eventName, handler) {
            const handlers = this.events.get(eventName) || [];
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
                this.events.set(eventName, handlers);
            }
        }
        emit(eventName, ...args) {
            const handlers = this.events.get(eventName) || [];
            handlers.forEach(handler => handler(...args));
        }
    }
    Laya["EventEmitter"] = EventEmitter;

    const EventId = {
        click_enter_game: 1,
    };

    class MyGobalValue {
        static setValue(key, value) {
            this.value.set(key, value);
        }
        static getValue(key) {
            return this.value.get(key);
        }
        static init() {
        }
        static get isWX() {
            if (this.value.get("isWX") == null) {
                if (Laya.Browser.onMiniGame) {
                    this.value.set("isWX", true);
                }
                else {
                    this.value.set("isWX", false);
                }
            }
            return this.value.get("isWX");
        }
        static get cdn() {
            if (this.value.get("cdn") == null) {
                if (Laya.Browser.window.params.cdnURL != null) {
                    this.value.set("cdn", Laya.Browser.window.params.cdnURL);
                }
                else {
                    this.value.set("cdn", "");
                }
            }
            return this.value.get("cdn");
        }
        static get version() {
            if (this.value.get("version") == null) {
                if (Laya.Browser.window.version != null) {
                    this.value.set("version", Laya.Browser.window.version);
                }
                else {
                    this.value.set("version", "0");
                }
            }
            return this.value.get("version");
        }
    }
    MyGobalValue.value = new Map();
    Laya["MyGobalValue"] = MyGobalValue;

    class StartMain {
        constructor() {
            EventEmitter.inst.on(EventId.click_enter_game, this.onClickEnterGame);
        }
        start() {
            this.initEngine();
        }
        initEngine() {
            Laya.loader.retryNum = 20;
            Laya.loader.retryDelay = 1000;
            Laya.loader.maxLoader = 5;
            this.initFormatURL();
            MyGobalValue.init();
            Laya.stage.addChild(fgui.GRoot.inst.displayObject);
            fgui.GRoot.inst.displayObject.zOrder = 100;
            fgui.UIPackage.loadPackage("res/UI/Common", Laya.Handler.create(this, () => { LogicMain.inst.init(); }));
        }
        loadLoginView() {
            fgui.UIPackage.loadPackage("startRes/Login", Laya.Handler.create(this, this.onLoginViewLoaded));
        }
        onLoginViewLoaded() {
            let _view = fgui.UIPackage.createObject("Login", "LoginView").asCom;
            _view.makeFullScreen();
            fgui.GRoot.inst.addChild(_view);
        }
        onClickEnterGame() {
        }
        initFormatURL() {
            if (MyGobalValue.isWX == false)
                return;
            Laya.URL.formatURL = function (url, base) {
                if (url.startsWith("http"))
                    return url;
                StartMain.urlRet = StartMain.urlMap.get(url);
                if (StartMain.urlRet != null)
                    return StartMain.urlRet;
                StartMain.urlRet = MyGobalValue.cdn + url + "?v=" + MyGobalValue.version;
                StartMain.urlMap.set(url, StartMain.urlRet);
                return StartMain.urlRet;
            };
        }
    }
    StartMain.urlMap = new Map();
    StartMain.urlRet = null;

    class Main {
        constructor() {
            this.tl = null;
            this.sport = null;
            this.testSprite = null;
            Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
            Laya["Physics"] && Laya["Physics"].enable();
            Laya["DebugPanel"] && Laya["DebugPanel"].enable();
            Laya.stage.scaleMode = GameConfig.scaleMode;
            Laya.stage.screenMode = GameConfig.screenMode;
            Laya.stage.alignV = GameConfig.alignV;
            Laya.stage.alignH = GameConfig.alignH;
            Laya.stage.bgColor = "#333333";
            Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
            if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
                Laya.enableDebugPanel();
            if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
                Laya["PhysicsDebugDraw"].enable();
            if (GameConfig.stat)
                Laya.Stat.show();
            let mapNode = new Laya.Node();
            mapNode.name = "mapNode";
            Laya.stage.addChild(mapNode);
            let floorNode = new Laya.Node();
            floorNode.name = "floorNode";
            Laya.stage.addChild(floorNode);
            let playerNode = new Laya.Node();
            playerNode.name = "playerNode";
            Laya.stage.addChild(playerNode);
            Laya.stage.addChild(fgui.GRoot.inst.displayObject);
            (new StartMain()).start();
        }
        testTimeline() {
            if (this.tl == null) {
                Laya.loader.load(["res/atlas/effect/base_fly_fire.atlas", "effect/base_fly_fire.ani"], Laya.Handler.create(this, this.onLoaded));
            }
            else {
                this.tl.stop();
                this.tl.removeSelf();
                this.tl.destroy();
                this.tl.clear();
                this.tl = null;
                Laya.Animation.clearCache("effect/base_fly_fire.ani");
                this.sport.removeSelf();
                this.sport.destroy();
                Laya.loader.clearRes("res/atlas/effect/base_fly_fire.atlas");
                Laya.loader.clearRes("/effect/base_fly_fire.ani");
                this.testSprite.removeSelf();
                this.testSprite.destroy();
                this.testSprite = null;
            }
        }
        onLoaded() {
            this.tl = new Laya.Animation();
            this.tl.loadAnimation("effect/base_fly_fire.ani");
            Laya.stage.addChild(this.tl);
            this.tl.pos(200, 200);
            this.tl.scale(0.5, 0.5);
            this.tl.play(0, true);
            this.tl.rotation = 45;
            this.sport = new Laya.Sprite();
            Laya.stage.addChild(this.sport);
            this.sport.graphics.drawCircle(200, 200, 10, "#ff0000");
            this.testSprite = new Laya.Sprite();
            Laya.stage.addChild(this.testSprite);
            this.testSprite.pos(200, 400);
            this.testSprite.loadImage("effect/base_fly_fire/base_fly_fire_3.png");
        }
    }
    new Main();

})();
