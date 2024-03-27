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