const { regClass, property } = Laya;

import { ManagerHub } from "../core/ManagerHub";
import { ResourceMgr } from "../resource/ResourceMgr";
import { ResImage } from "../resource/ResImage";

/**
 * 资源管理器测试脚本
 * 
 * 功能：
 * - 初始化 ManagerHub 和 ResourceMgr
 * - 动态加载图片资源
 * - 测试引用计数和对象池
 * 
 * 操作：
 * - A 键：创建图片（Add）
 * - C 键：清空图片（Clear）
 * - D 键：删除一个图片（Delete）- 验证单个删除
 * - R 键：重新创建图片（Recreate）- 验证缓存获取
 * - G 键：自动释放测试（GC Test）- 验证资源过期释放
 */
@regClass()
export class test_res extends Laya.Script {
    declare owner: Laya.Sprite;

    /** 测试图片路径（可在 IDE 中配置） */
    @property(String)
    public testImageUrl: string = "startupUI/login/imgs/btn_bg_blue.png";

    /** 是否显示提示文本 */
    @property(Boolean)
    public showTip: boolean = true;

    // ==================== 私有变量 ====================

    /** 已创建的图片列表 */
    private _testImages: ResImage[] = [];

    /** 提示文本节点 */
    private _tipText: Laya.Text | null = null;

    /** ManagerHub 是否已初始化 */
    private _isManagerInitialized: boolean = false;

    // ==================== 生命周期 ====================

    onAwake(): void {

        // 1. 初始化 ManagerHub 和 ResourceMgr
        this.initializeManagers();

        if (!this._isManagerInitialized) {
            console.error("[test_res] ❌ 初始化失败，脚本无法正常工作");
            return;
        }

        // 2. 启动 ManagerHub 的 update 循环
        this.startUpdateLoop();

        // 3. 监听键盘事件
        this.registerKeyboardEvents();

        // 4. 显示提示文本
        if (this.showTip) {
            this.createTipText();
        }

        console.log("[test_res] ✅ 初始化完成");
        this.printTip();
    }

    onDisable(): void {
        Laya.stage.off(Laya.Event.KEY_DOWN, this, this.handleKeyDown);
        this.clearAllImages();
        Laya.timer.clear(this, this.onUpdateFrame);
        Laya.timer.clear(this, this.checkResourceReleased);
    }

    onDestroy(): void {
        console.log("[test_res] 组件被销毁");
        if (this._isManagerInitialized) {
            ManagerHub.instance.release();
            this._isManagerInitialized = false;
        }
    }

    // ==================== 初始化方法 ====================

    private initializeManagers(): void {
        // ManagerHub 已在 LogicMain 中初始化，这里不再重复注册
        // ManagerHub.instance.register(ResourceMgr.instance);
        // ManagerHub.instance.init();
        this._isManagerInitialized = true;
    }

    private startUpdateLoop(): void {
        Laya.timer.frameLoop(1, this, this.onUpdateFrame);
    }

    private onUpdateFrame(): void {
        if (this._isManagerInitialized) {
            const dt = Laya.timer.delta / 1000;
            ManagerHub.instance.update(dt);
        }
    }

    private registerKeyboardEvents(): void {
        Laya.stage.on(Laya.Event.KEY_DOWN, this, this.handleKeyDown);
    }

    private createTipText(): void {
        this._tipText = new Laya.Text();
        this._tipText.fontSize = 24;
        this._tipText.color = "#FFFFFF";
        this._tipText.pos(20, 20);
        this._tipText.leading = 5;
        this.owner.addChild(this._tipText);
        this.updateTipText();
    }

    private printTip(): void {
        console.log("================ 操作指南 ================");
        console.log("  [A] 创建图片 (Add)");
        console.log("  [C] 清空图片 (Clear)");
        console.log("  [D] 删除一个 (Delete) - 验证单个删除");
        console.log("  [R] 重新创建 (Recreate) - 验证缓存获取");
        console.log("  [G] 释放测试 (GC Test) - 验证过期释放");
        console.log("==========================================");
    }

    // ==================== 事件处理 ====================

    private async handleKeyDown(e: Laya.Event): Promise<void> {
        if (!this._isManagerInitialized) return;

        switch (e.keyCode) {
            case Laya.Keyboard.A:
                await this.createTestImage();
                break;
            case Laya.Keyboard.C:
                this.clearAllImages();
                break;
            case Laya.Keyboard.D:
                this.deleteOneImage();
                break;
            case Laya.Keyboard.R:
                await this.recreateImage();
                break;
            case Laya.Keyboard.G:
                this.startAutoReleaseTest();
                break;
        }
    }

    // ==================== 资源测试功能 ====================

    /** [A] 创建测试图片 */
    private async createTestImage(): Promise<void> {
        try {
            const img = await ResourceMgr.instance.load(this.testImageUrl, ResImage);

            // 随机位置
            const x = Math.random() * (Laya.stage.width - 200) + 100;
            const y = Math.random() * (Laya.stage.height - 200) + 100;

            img.pos(x, y);
            img.setParent(this.owner);
            this._testImages.push(img);

            this.printResourceStatus();
            this.updateTipText();

        } catch (error) {
            console.error("[test_res] ❌ 图片加载失败:", error);
        }
    }

    /** [C] 清空所有图片 */
    private clearAllImages(): void {
        if (this._testImages.length === 0) return;

        for (const img of this._testImages) {
            ResourceMgr.instance.recoverRes(img);
        }
        this._testImages = [];
        this.printResourceStatus();
        this.updateTipText();
    }

    /** [D] 删除一个图片（验证单个删除） */
    private deleteOneImage(): void {
        if (this._testImages.length === 0) {
            console.log("[test_res] 没有图片可以删除");
            return;
        }

        const img = this._testImages.pop();
        if (img) {
            ResourceMgr.instance.recoverRes(img);
            this.printResourceStatus();
            this.updateTipText();
        }
    }

    /** [R] 重新创建图片（验证缓存优先级） */
    private async recreateImage(): Promise<void> {
        await this.createTestImage();
    }

    /** [G] 自动释放测试（验证过期释放） */
    private startAutoReleaseTest(): void {
        console.log("================ 🚀 开始自动释放测试 ================");

        // 1. 清空所有图片
        this.clearAllImages();

        // 2. 设置较短的缓存时间（3秒）
        ResourceMgr.instance.setCacheTime(3000);

        // 3. 打印当前状态
        this.printResourceStatus();

        // 4. 开始每秒检查一次，直到资源被释放
        Laya.timer.loop(1000, this, this.checkResourceReleased);
    }

    private checkResourceReleased(): void {
        const refInfo = ResourceMgr.instance.getRefInfo(this.testImageUrl);
        const cacheCount = ResourceMgr.instance.getCacheCount(this.testImageUrl);

        console.log(`[监控] 引用: ${refInfo?.refCount ?? 0}, 缓存: ${cacheCount}, 状态: ${refInfo?.loadState ?? '已销毁'}`);

        // 只有当 refInfo 为 null 时才真正表示资源已被彻底清理（因为 ResourceMgr 会在清理时删除 refInfo）
        if (!refInfo) {
            console.log("================ ✅ 测试通过：资源已被自动释放 ================");
            Laya.timer.clear(this, this.checkResourceReleased);

            // 恢复默认缓存时间
            ResourceMgr.instance.setCacheTime(5000);
            this.updateTipText();
        }
    }

    // ==================== 辅助方法 ====================

    private updateTipText(): void {
        if (!this._tipText) return;

        const refInfo = ResourceMgr.instance.getRefInfo(this.testImageUrl);
        const cacheCount = ResourceMgr.instance.getCacheCount(this.testImageUrl);

        this._tipText.text =
            `资源测试控制台\n` +
            `[A] 创建  [C] 清空  [D] 删一个\n` +
            `[R] 重建  [G] 释放测试\n\n` +
            `--- 状态 ---\n` +
            `当前显示: ${this._testImages.length}\n` +
            `引用计数: ${refInfo?.refCount ?? 0}\n` +
            `对象池数: ${cacheCount}\n` +
            `加载状态: ${refInfo?.loadState ?? "未加载"}`;
    }

    public printResourceStatus(): void {
        // const refInfo = ResourceMgr.instance.getRefInfo(this.testImageUrl);
        // const cacheCount = ResourceMgr.instance.getCacheCount(this.testImageUrl);
        // console.log(`[状态] 显示数: ${this._testImages.length}, 引用: ${refInfo?.refCount ?? 0}, 缓存池: ${cacheCount}`);
    }
}
