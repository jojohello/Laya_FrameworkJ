import { ResourceMgr } from "./resource/ResourceMgr";
import { ResImage } from "./resource/ResImage";
import { ManagerHub } from "./core/ManagerHub";

/**
 * 资源管理器测试场景
 * 按 A 键动态创建 Sprite 并加载图片
 */
export class ResourceTestScene extends Laya.Scene {
    private _testImages: ResImage[] = [];

    onEnable(): void {
        console.log("[ResourceTestScene] 场景启动");

        // ManagerHub 已在 LogicMain 中初始化，这里不再重复注册
        // ManagerHub.instance.register(ResourceMgr.instance);
        // ManagerHub.instance.init();

        // 启动 update 循环（关键！没有这个就不会触发自动清理）
        Laya.timer.frameLoop(1, this, this.onUpdate);

        // 监听键盘事件
        Laya.stage.on(Laya.Event.KEY_DOWN, this, this.onKeyDown);

        // 显示提示文本
        this.showTip();
    }

    onDisable(): void {
        console.log("[ResourceTestScene] 场景关闭");
        Laya.stage.off(Laya.Event.KEY_DOWN, this, this.onKeyDown);

        // 停止 update 循环
        Laya.timer.clear(this, this.onUpdate);

        // 回收所有资源
        for (let img of this._testImages) {
            ResourceMgr.instance.recoverRes(img);
        }
        this._testImages = [];
    }

    private onUpdate(): void {
        const dt = Laya.timer.delta / 1000;
        ManagerHub.instance.update(dt);
    }

    private showTip(): void {
        let tip = new Laya.Text();
        tip.text = "按 A 键创建图片\n按 C 键清空所有图片";
        tip.fontSize = 30;
        tip.color = "#FFFFFF";
        tip.pos(50, 50);
        this.addChild(tip);
    }

    private async onKeyDown(e: Laya.Event): Promise<void> {
        if (e.keyCode === Laya.Keyboard.A) {
            await this.createTestImage();
        } else if (e.keyCode === Laya.Keyboard.C) {
            this.clearAllImages();
        }
    }

    /**
     * 创建测试图片
     */
    private async createTestImage(): Promise<void> {
        try {
            console.log("[ResourceTestScene] 开始加载图片...");

            // 使用项目中存在的图片资源（不需要 "assets" 前缀）
            let testImageUrl = "startupUI/login/imgs/btn_bg_blue.png";

            // 通过 ResourceMgr 加载图片
            let img = await ResourceMgr.instance.load(testImageUrl, ResImage);

            // 随机位置
            let x = Math.random() * (Laya.stage.width - 100) + 50;
            let y = Math.random() * (Laya.stage.height - 100) + 50;

            img.pos(x, y);
            img.setParent(this);

            this._testImages.push(img);

            console.log(`[ResourceTestScene] ✅ 图片创建成功，当前数量: ${this._testImages.length}`);

            // 打印引用计数信息
            let refInfo = ResourceMgr.instance.getRefInfo(testImageUrl);
            console.log(`  - 引用计数: ${refInfo?.refCount}`);
        } catch (error) {
            console.error("[ResourceTestScene] ❌ 图片加载失败:", error);
        }
    }

    /**
     * 清空所有图片
     */
    private clearAllImages(): void {
        console.log(`[ResourceTestScene] 清空 ${this._testImages.length} 个图片`);

        for (let img of this._testImages) {
            ResourceMgr.instance.recoverRes(img);
        }

        this._testImages = [];
        console.log("[ResourceTestScene] ✅ 清空完成");
    }
}
