// jojohello 2023-10-27
// 用覆盖的方法，对原生库的方法进行优化
// 要写明方法使新增还是修改，要标明修改的地方，方便以后库更新的时候进行修改

// fgui的GComponent类新增_addAttrNames属性
fgui.GComponent.prototype["_addAttrNames"] = [];

// fgui的GComponent类新增addAttr方法，将他的子结点作为属性加到自己身上，后面代码调用的时候就不需要使用getChild方法了
fgui.GComponent.prototype["addAttr"] = function(attrName, obj) {
    if (attrName == 'title' || attrName == 'icon' || attrName == 'button' || attrName == 'mask') 
        return;

    this[attrName] = obj;
    if (this._addAttrNames.indexOf(attrName) == -1) {
        this._addAttrNames.push(attrName);
    }
}

// 修改fgui的GComponent类的constructFromResource2方法
fgui.GComponent.prototype["constructFromResource2"] = function(objectPool, poolIndex) {
    var contentItem = this.packageItem.getBranch();
    if (!contentItem.decoded) {
        contentItem.decoded = true;
        fgui.TranslationHelper.translateComponent(contentItem);
    }
    var i;
    var dataLen;
    var curPos;
    var nextPos;
    var f1;
    var f2;
    var i1;
    var i2;
    var buffer = contentItem.rawData;
    buffer.seek(0, 0);
    this._underConstruct = true;
    this.sourceWidth = buffer.getInt32();
    this.sourceHeight = buffer.getInt32();
    this.initWidth = this.sourceWidth;
    this.initHeight = this.sourceHeight;
    this.setSize(this.sourceWidth, this.sourceHeight);
    if (buffer.readBool()) {
        this.minWidth = buffer.getInt32();
        this.maxWidth = buffer.getInt32();
        this.minHeight = buffer.getInt32();
        this.maxHeight = buffer.getInt32();
    }
    if (buffer.readBool()) {
        f1 = buffer.getFloat32();
        f2 = buffer.getFloat32();
        this.internalSetPivot(f1, f2, buffer.readBool());
    }
    if (buffer.readBool()) {
        this._margin.top = buffer.getInt32();
        this._margin.bottom = buffer.getInt32();
        this._margin.left = buffer.getInt32();
        this._margin.right = buffer.getInt32();
    }
    var overflow = buffer.readByte();
    if (overflow == fgui.OverflowType.Scroll) {
        var savedPos = buffer.pos;
        buffer.seek(0, 7);
        this.setupScroll(buffer);
        buffer.pos = savedPos;
    }
    else
        this.setupOverflow(overflow);
    if (buffer.readBool())
        buffer.skip(8);
    this._buildingDisplayList = true;
    buffer.seek(0, 1);
    var controllerCount = buffer.getInt16();
    for (i = 0; i < controllerCount; i++) {
        nextPos = buffer.getInt16();
        nextPos += buffer.pos;
        var controller = new fgui.Controller();
        this._controllers.push(controller);
        controller.parent = this;
        controller.setup(buffer);
        buffer.pos = nextPos;

        // new add 将子节点引用到最上层，方便查找
        this.addAttr(controller.name, controller);
    }
    buffer.seek(0, 2);
    var child;
    var childCount = buffer.getInt16();
    for (i = 0; i < childCount; i++) {
        dataLen = buffer.getInt16();
        curPos = buffer.pos;
        if (objectPool)
            child = objectPool[poolIndex + i];
        else {
            buffer.seek(curPos, 0);
            var type = buffer.readByte();
            var src = buffer.readS();
            var pkgId = buffer.readS();
            var pi = null;
            if (src != null) {
                var pkg;
                if (pkgId != null)
                    pkg = fgui.UIPackage.getById(pkgId);
                else
                    pkg = contentItem.owner;
                pi = pkg ? pkg.getItemById(src) : null;
            }
            if (pi) {
                child = fgui.UIObjectFactory.newObject(pi);
                child.constructFromResource();
            }
            else
                child = fgui.UIObjectFactory.newObject(type);
        }
        child._underConstruct = true;
        child.setup_beforeAdd(buffer, curPos);
        child.parent = this;
        this._children.push(child);
        buffer.pos = curPos + dataLen;

        // new add 将子节点引用到最上层，方便查找
        this.addAttr(child.name, child);
    }
    buffer.seek(0, 3);
    this.relations.setup(buffer, true);
    buffer.seek(0, 2);
    buffer.skip(2);
    for (i = 0; i < childCount; i++) {
        nextPos = buffer.getInt16();
        nextPos += buffer.pos;
        buffer.seek(buffer.pos, 3);
        this._children[i].relations.setup(buffer, false);
        buffer.pos = nextPos;
    }
    buffer.seek(0, 2);
    buffer.skip(2);
    for (i = 0; i < childCount; i++) {
        nextPos = buffer.getInt16();
        nextPos += buffer.pos;
        child = this._children[i];
        child.setup_afterAdd(buffer, buffer.pos);
        child._underConstruct = false;
        buffer.pos = nextPos;
    }
    buffer.seek(0, 4);
    buffer.skip(2); //customData
    this.opaque = buffer.readBool();
    var maskId = buffer.getInt16();
    if (maskId != -1) {
        this.setMask(this.getChildAt(maskId).displayObject, buffer.readBool());
    }
    var hitTestId = buffer.readS();
    i1 = buffer.getInt32();
    i2 = buffer.getInt32();
    var hitArea;
    if (hitTestId) {
        pi = contentItem.owner.getItemById(hitTestId);
        if (pi && pi.pixelHitTestData)
            hitArea = new fgui.PixelHitTest(pi.pixelHitTestData, i1, i2);
    }
    else if (i1 != 0 && i2 != -1) {
        hitArea = new fgui.ChildHitArea(this.getChildAt(i2).displayObject);
    }
    if (hitArea) {
        this._displayObject.hitArea = hitArea;
        this._displayObject.mouseThrough = false;
        this._displayObject.hitTestPrior = true;
    }
    buffer.seek(0, 5);
    var transitionCount = buffer.getInt16();
    for (i = 0; i < transitionCount; i++) {
        nextPos = buffer.getInt16();
        nextPos += buffer.pos;
        var trans = new fgui.Transition(this);
        trans.setup(buffer);
        this._transitions.push(trans);
        buffer.pos = nextPos;

        //new add 将子节点引用到最上层，方便查找
        this.addAttr(trans.name, trans);
    }
    if (this._transitions.length > 0) {
        this.displayObject.on(Laya.Event.DISPLAY, this, this.___added);
        this.displayObject.on(Laya.Event.UNDISPLAY, this, this.___removed);
    }
    this.applyAllControllers();
    this._buildingDisplayList = false;
    this._underConstruct = false;
    this.buildNativeDisplayList();
    this.setBoundsChangedFlag();
    if (contentItem.objectType != fgui.ObjectType.Component)
        this.constructExtension(buffer);
    this.onConstruct();
}

// 修改fgui的GComponent类的constructor方法
fgui.GComponent.prototype["constructor"] = function() {
    this.super();
    this._sortingChildCount = 0;
    this._children = [];
    this._controllers = [];
    this._transitions = [];
    this._margin = new fgui.Margin();
    this._alignOffset = new Laya.Point();
    this._opaque = false;
    this._childrenRenderOrder = 0;
    this._apexIndex = 0;
    // new add
    this._addAttrNames = [];
}

// 修改fgui的GComponent类的dispose方法
fgui.GComponent.prototype["dispose"] = function() {
    // new add
    for (const attrName of this._addAttrNames) {
        delete this[attrName]
    }
    this._addAttrNames.length = 0;
    
    var i;
    var cnt;
    cnt = this._transitions.length;
    for (i = 0; i < cnt; ++i) {
        var trans = this._transitions[i];
        trans.dispose();
    }
    cnt = this._controllers.length;
    for (i = 0; i < cnt; ++i) {
        var cc = this._controllers[i];
        cc.dispose();
    }
    if (this.scrollPane)
        this.scrollPane.dispose();
    cnt = this._children.length;
    for (i = cnt - 1; i >= 0; --i) {
        var obj = this._children[i];
        obj.parent = null; //avoid removeFromParent call
        obj.dispose();
    }
    this._boundsChanged = false;
    Object.getPrototypeOf(fgui.GComponent.prototype).dispose.call(this);
}

// 提供换装系统，通过修改Laya的Animation类，实现换装
class AvatarAnimation extends Laya.Animation {
    constructor() {
        super();
        this._init();
    }

    // 键值对，内容为{partName:[关联的资源名字]}，比如 {“body”:["body", "lefthand", "righthand"]},
    // 意思就是，比如我们body使用了id为1的衣服，那么身体的资源名字为body_1,左手的资源名字为lefthand_1, 右手的资源名字为righthand_1
    // 我在这里还是给出基本范例，项目组可以根据自己的情况，自行设值
    static avatarPartDef = {  "hair":["faxing"], 
                        "body":["yifu", "uparm_right", "uparm_left", "downarm_left", "downarm_right"], 
                        "face":["biaoqing"], 
                        "pants":["kuzi_run_left", "kuzi_run_right", "kuzi_stand_left", "kuzi_stand_right", "kuzi_jump_left", "kuzi_jump_right"],
                    }; 
    static rootPath = "character/"; // 资源根目录 
    // 键值对，内容为{partName:id}，id可以为数字，也可以为字符串，看自己项目组的规定，比如为了美术跟策划便是方便，衣服可以较 buyi（布衣） 盔甲（盔甲）
    // 那么你可以定义内容为{“body”, buyi},而不是{“body”, 1}
    // 我在这里还是给出基本范例，项目组可以根据自己的情况，自行设值
    _avatarPartInfo = {"body":1, "hair":"toukui1", "face":1, "pants":1}; 
    
    _texInfo = {}; // 键值对，内容为{部位名字:Texture}，用于存储已经加载的资源

    _id = 0;
    
    changePart(partName, id){
        if(this._avatarPartInfo[partName] == id || !AvatarAnimation.avatarPartDef.hasOwnProperty(partName)){
            return;
        }

        this._avatarPartInfo[partName] = id;

        if(this._frames == null)
            return;

        var subpartNames = AvatarAnimation.avatarPartDef[partName];
        for(var i = 0; i < subpartNames.length; i++){
            var texName = subpartNames[i] + "_" + id;
            this._texInfo[subpartNames[i]] = Laya.loader.getRes(AvatarAnimation.rootPath + texName + ".png");

            for(var j = 0; j < this._frames.length; j++){
                var frame = this._frames[j];
                if(frame["texIndexs"] == null)
                    continue;

                var cmd = frame.cmds[ frame["texIndexs"][subpartNames[i]] ];
                if(cmd == null)
                    continue;

                cmd.texture = this._texInfo[subpartNames[i]];
                cmd.width = this._texInfo[subpartNames[i]].width;
                cmd.height = this._texInfo[subpartNames[i]].height;
            }
        }
    }

    _init(){
        // 根据部位定义以及部位信息，缓存贴图资源
        for(var k in AvatarAnimation.avatarPartDef){
            var partNames = AvatarAnimation.avatarPartDef[k];
            for(var i = 0; i < partNames.length; i++){
                var partName = partNames[i];
                var texName = partName + "_" + this._avatarPartInfo[k];
                this._texInfo[partName] = Laya.loader.getRes(AvatarAnimation.rootPath + texName + ".png");
            }
        }
    }

    _setFrames(frames){
        this._frames = frames;
        this._count = this._frames.length;

        this._initTexs();
    }

    _addFrame(newFrame){
        this._frames.push(newFrame);
        this._count = this._frames.length;
    }

    // 遍历所有的帧，将帧中的贴图资源替换成换装后的贴图资源
    _initTexs(){
        for(var i = 0; i < this._frames.length; i++){
            var frame = this._frames[i];

            // 在Graphic新增一个属性，用来记录那个部位在哪个cmd里面
            if(frame["texIndexs"]){
                for(var k in frame["texIndexs"]){
                    var cmd = frame.cmds[ frame["texIndexs"][k]];
                    cmd.texture = this._texInfo[k];
                }
            }else{
                frame["texIndexs"] = {};
                for(var j = 0; j < frame.cmds.length; j++){
                    var cmd = frame.cmds[j];
                    if(cmd.texture == null)
                        continue;

                    var texName = cmd.texture.url;
                    for(var k in this._texInfo){
                        if(texName.includes(k) == false)
                            continue;

                        frame["texIndexs"][k] = j;
                        cmd.texture = this._texInfo[k];
                        break;
                    }
                }
            }
        }
    }

    _cacheFrames(){
        if(this._frames == null)
            return;

        var name = this._actionName;
        if (this._url)
            name = this._url + "#" + name;

        if (!AvatarAnimation.framesMap[name]) {
            AvatarAnimation.framesMap[name] = [];
        }

        AvatarAnimation.framesMap[name].push(this._frames);
    }

    // 重写_setFramesFromCache函数
    _setFramesFromCache(name, showWarn = false) {
        // ------------ 原代码 ------------
        // if (this._url)
        //     name = this._url + "#" + name;
        // if (name && Animation.framesMap[name]) {
        //     var tAniO = Animation.framesMap[name];
        //     if (tAniO instanceof Array) {
        //         this._frames = Animation.framesMap[name];
        //         this._count = this._frames.length;
        //     }
        //     else {
        //         if (tAniO.nodeRoot) {
        //             Animation.framesMap[name] = GraphicAnimation.parseAnimationByData(tAniO);
        //             tAniO = Animation.framesMap[name];
        //         }
        //         this._frames = tAniO.frames;
        //         this._count = this._frames.length;
        //         if (!this._frameRateChanged)
        //             this._interval = tAniO.interval;
        //         this._labels = this._copyLabels(tAniO.labels);
        //     }
            
        //     return true;
        // }
        // else {
        //     if (showWarn)
        //         console.log("ani not found:", name);
        // }
        // return false;
        // ------------ 新代码 ------------
        if (this._url)
            name = this._url + "#" + name;
        // 如果队列缓存里面还有，就直接用队列缓存里面的
        if (name && AvatarAnimation.framesMap[name] && AvatarAnimation.framesMap[name].length > 0) {
            this._cacheFrames();
            this._actionName = name;
            this._setFrames(AvatarAnimation.framesMap[name].pop());
            return true;
        }else if (name && Laya.Animation.framesMap[name]) { // 如果队列缓存里面没有，用Animation里面的信息再生成一份
            var tAniO = Laya.Animation.framesMap[name];
            if (tAniO instanceof Array) {
                // 重新生成一份独立的实例
				//  this._frames = Animation.framesMap[name];
				var srcFrames = Laya.Animation.framesMap[name];
                this._cacheFrames();
                this._actionName = name;
				this._frames = [];
				var tempFrame;
				for(var i = 0; i < srcFrames.length; i++){
					var newFrame = new Laya.Graphics();
                    
					tempFrame = srcFrames[i];
					for(var j = 0; j < tempFrame.cmds.length; j++) {
						// this._frames[i].drawImage(tempFrame.cmds[j].texture, tempFrame.cmds[j].x, tempFrame.cmds[j].y, tempFrame.cmds[j].width, tempFrame.cmds[j].height, tempFrame.cmds[j].matrix, tempFrame.cmds[j].alpha);
                        newFrame._cmds.push(Laya.DrawTextureCmd.create.call(newFrame, tempFrame.cmds[j].texture, tempFrame.cmds[j].x, tempFrame.cmds[j].y, tempFrame.cmds[j].width, tempFrame.cmds[j].height, tempFrame.cmds[j].matrix, tempFrame.cmds[j].alpha, tempFrame.cmds[j].color, tempFrame.cmds[j].blendMode, tempFrame.cmds[j].uv));
					}

                    this._addFrame(newFrame);
				}
				//---------------------------------------------------------------------------------------------------------                
            }
            else {
                if (tAniO.nodeRoot) {
                    Laya.Animation.framesMap[name] = Laya.GraphicAnimation.parseAnimationByData(tAniO);
                    tAniO = Laya.Animation.framesMap[name];
                }
                // 解析后，再生成一份实例
                // this._frames = tAniO.frames;
				var srcFrames = tAniO.frames;
                this._cacheFrames();
                this._actionName = name;
				this._frames = [];
				var tempFrame;
				for(var i = 0; i < srcFrames.length; i++){
					var newFrame = new Laya.Graphics();
                    newFrame.cmds = [];
					tempFrame = srcFrames[i];

					for(var j = 0; j < tempFrame.cmds.length; j++) {
                        newFrame.cmds.push(Laya.DrawTextureCmd.create.call(newFrame, tempFrame.cmds[j].texture, tempFrame.cmds[j].x, tempFrame.cmds[j].y, tempFrame.cmds[j].width, tempFrame.cmds[j].height, tempFrame.cmds[j].matrix, tempFrame.cmds[j].alpha, tempFrame.cmds[j].color, tempFrame.cmds[j].blendMode, tempFrame.cmds[j].uv));
					}

                    this._addFrame(newFrame);
				}
				//---------------------------------------------------------------------------------------------------------
                this._initTexs();
                if (!this._frameRateChanged)
                    this._interval = tAniO.interval;
                this._labels = this._copyLabels(tAniO.labels);
            }
            
            return true;
        }
        else {
            if (showWarn)
                console.log("ani not found:", name);
        }
        return false;
    }
}

window.Laya["AvatarAnimation"] = AvatarAnimation;
AvatarAnimation.framesMap = {};