import { IManager } from "../../core/IManager";
import { UILayer } from "../../core/LayerDef";
import { UIManager } from "../UIManager";
import { DialogHandle, DialogOptions } from "./IDialog";

/** 统一管理模态弹窗，保证 mask、层级和回调生命周期一致。 */
export class DialogMgr implements IManager {
    private static _instance: DialogMgr;
    static get instance(): DialogMgr {
        if (!this._instance) this._instance = new DialogMgr();
        return this._instance;
    }

    private _active: { root: Laya.Scene; options: DialogOptions } | null = null;
    private constructor() {}

    async init(): Promise<void> {}
    update(_dt: number): void {}
    reset(): void { this.close(); }
    release(): void { this.close(); }

    async show(options: DialogOptions): Promise<DialogHandle> {
        this.close();
        const root = await UIManager.instance.open("CommonDialog", { modal: true });
        if (!(root instanceof Laya.Scene)) throw new Error("CommonDialog resource did not create a Scene");
        root.zOrder = UILayer.Pop;
        this._active = { root, options };
        this.bindResource(root, options);
        return { close: () => this.close() };
    }

    close(notifyClosed: boolean = true): void {
        const active = this._active;
        if (!active) return;
        this._active = null;
        this.unbindResource(active.root);
        if (notifyClosed) active.options.onClosed?.(false);
        UIManager.instance.close("CommonDialog");
    }

    get isOpened(): boolean { return this._active !== null; }

    private bindResource(root: Laya.Scene, options: DialogOptions): void {
        const panel = this.getChild(root, "panel");
        const title = this.getChild(panel, "titleText") as any;
        const context = this.getChild(panel, "contextText") as any;
        const confirm = this.getChild(panel, "confirmButton") as any;
        const cancel = this.getChild(panel, "cancelButton") as any;
        const close = this.getChild(panel, "closeButton") as any;
        if (!panel || !title || !context || !confirm || !cancel || !close) {
            throw new Error("CommonDialog resource is missing required nodes");
        }
        title.text = options.title || "提示";
        context.text = options.message;
        this.setButtonText(confirm, options.confirmText || "确定");
        this.setButtonText(cancel, options.cancelText || "取消");
        const controller = panel.getController?.("dialogButtons");
        if (controller) controller.selectedIndex = options.cancelText ? 1 : 0;
        cancel.visible = !!options.cancelText;
        close.visible = options.showClose !== false;
        close.touchable = options.showClose !== false;
        confirm.off(Laya.Event.CLICK, this, this.onConfirmClick);
        cancel.off(Laya.Event.CLICK, this, this.onCancelClick);
        close.off(Laya.Event.CLICK, this, this.onCloseClick);
        confirm.on(Laya.Event.CLICK, this, this.onConfirmClick);
        cancel.on(Laya.Event.CLICK, this, this.onCancelClick);
        close.on(Laya.Event.CLICK, this, this.onCloseClick);
    }

    private unbindResource(root: Laya.Scene): void {
        const panel = this.getChild(root, "panel");
        this.getChild(panel, "confirmButton")?.off(Laya.Event.CLICK, this, this.onConfirmClick);
        this.getChild(panel, "cancelButton")?.off(Laya.Event.CLICK, this, this.onCancelClick);
        this.getChild(panel, "closeButton")?.off(Laya.Event.CLICK, this, this.onCloseClick);
    }

    private onConfirmClick(): void {
        const options = this._active?.options;
        if (!options) return;
        options.onConfirm?.();
        options.onClosed?.(true);
        this.close(false);
    }

    private onCancelClick(): void {
        const options = this._active?.options;
        if (!options) return;
        options.onCancel?.();
        options.onClosed?.(false);
        this.close(false);
    }

    private onCloseClick(): void {
        const options = this._active?.options;
        if (!options) return;
        options.onClose?.();
        options.onClosed?.(false);
        this.close(false);
    }

    private setButtonText(button: any, text: string): void {
        button.title = text;
        const label = this.getChild(button, "label");
        if (label) label.text = text;
    }

    private getChild(parent: any, name: string): any {
        if (!parent) return null;
        return parent.getChild?.(name) || parent.getChildByName?.(name) || null;
    }
}
