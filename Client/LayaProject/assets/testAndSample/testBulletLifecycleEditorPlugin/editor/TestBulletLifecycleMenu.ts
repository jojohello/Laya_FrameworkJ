import type { BulletLifecycleTestId } from "../scene/BulletLifecycleEditorTestRunner";

class BulletLifecycleTestDialog extends IEditor.Dialog<gui.Box> {
    private _status!: gui.Label;
    private _buttons: gui.Button[] = [];

    async create(): Promise<void> {
        const root = new gui.Box();
        root.setSize(650, 318);
        this.contentPane = root;
        this.title = "无 UI 自动测试";
        this.setSize(650, 318);

        const description = new gui.Label();
        description.text = "在 IDE Scene 进程执行真实战斗逻辑；不会创建角色、子弹、血条或游戏 UI。";
        description.setPos(18, 14);
        description.setSize(614, 28);
        root.addChild(description);

        this.addTestButton(root, "直线子弹命中与回收", 18, 58, "lineBulletHit");
        this.addTestButton(root, "目标释放后子弹取消", 174, 58, "releasedTargetReuse");
        this.addTestButton(root, "场景销毁后重新创建", 330, 58, "sceneDestroyRecreate");
        this.addTestButton(root, "技能延迟后释放", 18, 106, "skillRelease");
        this.addTestButton(root, "Buff Tick 后释放", 174, 106, "buffRelease");
        this.addTestButton(root, "AI 三组调度与回池", 330, 106, "aiSchedulerLifecycle");
        this.addTestButton(root, "运行全部测试", 18, 154);
        this.addTestButton(root, "同队前排阻挡绕行与回池", 174, 154, "crowdAvoidance");
        this.addTestButton(root, "绕行后进入攻击距离", 330, 154, "crowdAvoidanceArrival");
        this.addTestButton(root, "后台冻结与暂停保持", 18, 202, "sceneBackgroundPause");

        this._status = new gui.Label();
        this._status.text = "请选择要执行的测试。";
        this._status.setPos(18, 254);
        this._status.setSize(614, 40);
        root.addChild(this._status);
    }

    private addTestButton(root: gui.Box, title: string, x: number, y: number, testId?: BulletLifecycleTestId): void {
        const button = IEditor.GUIUtils.createButton(false);
        button.title = title;
        button.setPos(x, y);
        button.setSize(145, 36);
        button.onClick(() => this.runTest(title, testId));
        root.addChild(button);
        this._buttons.push(button);
    }

    private async runTest(title: string, testId?: BulletLifecycleTestId): Promise<void> {
        this.setButtonsEnabled(false);
        this._status.text = `正在执行：${title}`;
        try {
            const result = await Editor.scene.runScript("BulletLifecycleEditorTestRunner.run", testId);
            this._status.text = `通过：${title}（${result.totalCount} 项）`;
            console.info(`[HeadlessTest] EDITOR SUMMARY total=${result.totalCount} failed=${result.failedCount}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this._status.text = `失败：${title} — ${message}`;
            console.error(`[HeadlessTest] EDITOR FAIL ${title}`, error);
        } finally {
            this.setButtonsEnabled(true);
        }
    }

    private setButtonsEnabled(enabled: boolean): void {
        for (const button of this._buttons) button.enabled = enabled;
    }
}

/** IDE-only popup entry for the headless bullet lifecycle regression suite. */
export class TestBulletLifecycleMenu {
    @IEditor.menu("App/tool/runBulletLifecycleHeadlessTest")
    static async open(): Promise<void> {
        await Editor.showDialog(BulletLifecycleTestDialog);
    }
}
