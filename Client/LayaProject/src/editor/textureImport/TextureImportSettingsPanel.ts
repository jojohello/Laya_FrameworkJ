import {
    cloneDefaultTextureImportRules,
    createTextureImportRule,
    normalizeTextureImportRule,
    normalizeAssetPath,
    TEXTURE_IMPORT_DIALOG_NAME,
    TEXTURE_IMPORT_SETTINGS_NAME,
    TEXTURE_IMPORT_SETTINGS_TYPE,
    TextureDirectoryReimportReport,
    TextureImportAuditReport,
    TextureImportRuleData,
    TextureImportSettingsData,
    validateTextureImportRules,
} from "./TextureImportTypes";
import "./TextureImportSettingsRegistration";

/** Independent editor window for editing, auditing and applying texture import rules. */
export class TextureImportDialog extends IEditor.Dialog<gui.Box> {
    private _draft: TextureImportSettingsData;
    private _inspector: IEditor.InspectorPanel;
    private _status: IEditor.TextArea;
    private _buttons: gui.Button[] = [];

    async create(): Promise<void> {
        this.name = TEXTURE_IMPORT_DIALOG_NAME;
        this.title = "纹理配置";
        this.saveBounds = true;
        this.resizable = true;
        this.modal = false;
        this.setSize(980, 760);

        const root = new gui.Box();
        root.setSize(940, 700);
        this.contentPane = root;

        const settings = Editor.getSettings(TEXTURE_IMPORT_SETTINGS_NAME).data as Partial<TextureImportSettingsData>;
        this._draft = {
            version: Number(settings.version ?? 1),
            rules: Array.isArray(settings.rules)
                ? settings.rules.map(rule => normalizeTextureImportRule(rule))
                : cloneDefaultTextureImportRules(),
        };

        this._inspector = IEditor.GUIUtils.createInspectorPanel();
        this._inspector.allowUndo = true;
        this._inspector.setPos(12, 12);
        this._inspector.setSize(916, 470);
        this._inspector.addRelation(root, gui.RelationType.Width);
        this._inspector.addRelation(root, gui.RelationType.Height);
        this._inspector.onDataChanged.add(this.onDraftChanged, this);
        root.addChild(this._inspector);
        this.inspectDraft();

        this._status = IEditor.GUIUtils.createTextArea();
        this._status.editable = false;
        this._status.text = "可编辑规则后保存，或直接执行审计。审计与应用都会先保存当前规则。";
        this._status.setPos(12, 494);
        this._status.setSize(916, 126);
        this._status.addRelation(root, gui.RelationType.Width);
        this._status.addRelation(root, gui.RelationType.Bottom_Bottom);
        root.addChild(this._status);

        const buttonBar = new gui.Box();
        buttonBar.layout.type = gui.LayoutType.SingleRow;
        buttonBar.layout.columnGap = 8;
        buttonBar.layout.stretchY = gui.StretchMode.Stretch;
        buttonBar.setPos(12, 636);
        buttonBar.setSize(916, 34);
        buttonBar.addRelation(root, gui.RelationType.Width);
        buttonBar.addRelation(root, gui.RelationType.Bottom_Bottom);
        root.addChild(buttonBar);

        this.addButton(buttonBar, "选择文件夹添加规则", 142, () => void this.addFolderRule());
        this.addButton(buttonBar, "恢复默认", 100, () => this.restoreDefaults());
        this.addButton(buttonBar, "保存规则", 100, () => this.saveRules());
        this.addButton(buttonBar, "审计规则", 100, () => void this.auditRules());
        this.addButton(buttonBar, "保存并应用、重新导入", 180, () => void this.applyRules());
        this.addButton(buttonBar, "重新导入规则目录", 158, () => void this.reimportRuleDirectories());
        this.addButton(buttonBar, "关闭", 80, () => this.hide());
    }

    private addButton(parent: gui.Box, title: string, width: number, handler: () => void): void {
        const button = IEditor.GUIUtils.createButton(false);
        button.title = title;
        button.setSize(width, 34);
        button.onClick(handler, this);
        parent.addChild(button);
        this._buttons.push(button);
    }

    private inspectDraft(): void {
        this._inspector.resetInspectors();
        this._inspector.inspect(this._draft, TEXTURE_IMPORT_SETTINGS_TYPE);
    }

    private onDraftChanged(): void {
        this._status.text = "规则已修改但尚未保存。";
    }

    private async addFolderRule(): Promise<void> {
        const result = await Editor.showOpenDialog({
            title: "选择 assets 内的纹理资源文件夹",
            defaultPath: Editor.assetsPath,
            buttonLabel: "选择文件夹",
            properties: ["openDirectory"],
        });
        if (result.canceled || result.filePaths.length === 0) return;

        const relativePath = this.toAssetRelativePath(result.filePaths[0]);
        if (relativePath === undefined) {
            await Editor.alert("只能选择当前项目 assets 目录内的文件夹。", "warning");
            return;
        }
        if (!relativePath) {
            await Editor.alert("不能直接为 assets 根目录创建规则，请选择其子目录。", "warning");
            return;
        }

        const existing = this._draft.rules.find(rule => normalizeAssetPath(rule.path) === relativePath);
        if (existing) {
            this._status.text = `目录 ${relativePath} 已存在于规则 ${existing.id}。`;
            return;
        }

        const rule = createTextureImportRule(this.createUniqueRuleId(relativePath), relativePath);
        this._draft.rules.push(rule);
        this.inspectDraft();
        this._status.text = `已添加目录规则：${relativePath}（尚未保存）`;
    }

    private restoreDefaults(): void {
        this._draft = { version: 1, rules: cloneDefaultTextureImportRules() };
        this.inspectDraft();
        this._status.text = "已恢复默认规则，但尚未保存。";
    }

    private saveRules(): boolean {
        const errors = validateTextureImportRules(this._draft);
        if (errors.length > 0) {
            this._status.text = `规则未保存：\n${errors.join("\n")}`;
            return false;
        }

        const target = Editor.getSettings(TEXTURE_IMPORT_SETTINGS_NAME).data as Partial<TextureImportSettingsData>;
        target.version = 1;
        target.rules = this.cloneRules(this._draft.rules);
        this._status.text = `已保存 ${this._draft.rules.length} 条纹理目录规则。`;
        return true;
    }

    private async auditRules(): Promise<void> {
        if (!this.saveRules()) return;
        await this.runBusy(async () => {
            const report = await Editor.scene.runScript("TextureImportCommands.audit") as TextureImportAuditReport;
            this._status.text = this.formatReport("纹理导入规则审计", report);
        }, "纹理规则审计失败");
    }

    private async applyRules(): Promise<void> {
        if (!this.saveRules()) return;
        let audit: TextureImportAuditReport | undefined;
        await this.runBusy(async () => {
            audit = await Editor.scene.runScript("TextureImportCommands.audit") as TextureImportAuditReport;
        }, "纹理规则审计失败");
        if (!audit) return;
        if (audit.invalidRules.length > 0 || audit.errors.length > 0) {
            this._status.text = this.formatReport("规则存在错误，未执行重新导入", audit);
            return;
        }
        if (audit.needsChange === 0) {
            this._status.text = this.formatReport("纹理规则已经同步", audit);
            return;
        }

        const confirmation = await Editor.showMessageBox({
            type: "question",
            title: "应用纹理导入规则",
            message: `将重新导入 ${audit.needsChange} 张图片，是否继续？`,
            detail: audit.changedPaths.slice(0, 12).join("\n"),
            buttons: ["应用", "取消"],
            defaultId: 0,
            cancelId: 1,
            noLink: true,
        });
        if (confirmation.response !== 0) return;

        await this.runBusy(async () => {
            const report = await Editor.scene.runScript("TextureImportCommands.applyAndReimport") as TextureImportAuditReport;
            this._status.text = this.formatReport("纹理规则应用完成", report);
        }, "应用纹理规则失败");
    }

    private async reimportRuleDirectories(): Promise<void> {
        if (!this.saveRules()) return;
        let inspection: TextureDirectoryReimportReport | undefined;
        await this.runBusy(async () => {
            inspection = await Editor.scene.runScript("TextureImportCommands.inspectConfiguredDirectories") as TextureDirectoryReimportReport;
        }, "检查规则目录失败");
        if (!inspection) return;
        if (inspection.invalidRules.length > 0 || inspection.missingPaths.length > 0) {
            this._status.text = this.formatDirectoryReimportReport("规则目录存在错误，未执行重新导入", inspection);
            return;
        }

        const confirmation = await Editor.showMessageBox({
            type: "question",
            title: "重新导入规则目录",
            message: `将重新导入 ${inspection.directories} 个规则目录中的 ${inspection.assets} 个资源，是否继续？`,
            detail: `第一阶段图片：${inspection.images}\n第二阶段其他资源：${inspection.otherAssets}\n执行前请停止游戏预览。`,
            buttons: ["重新导入", "取消"],
            defaultId: 0,
            cancelId: 1,
            noLink: true,
        });
        if (confirmation.response !== 0) return;

        await this.runBusy(async () => {
            const report = await Editor.scene.runScript("TextureImportCommands.reimportConfiguredDirectories") as TextureDirectoryReimportReport;
            this._status.text = this.formatDirectoryReimportReport("规则目录重新导入完成", report);
        }, "重新导入规则目录失败");
    }

    private async runBusy(action: () => Promise<void>, errorTitle: string): Promise<void> {
        this.setButtonsEnabled(false);
        this.showModalWait(errorTitle.replace("失败", "中…"));
        try {
            await action();
        } catch (error) {
            this._status.text = `${errorTitle}：${error instanceof Error ? error.message : String(error)}`;
        } finally {
            this.closeModalWait();
            this.setButtonsEnabled(true);
        }
    }

    private setButtonsEnabled(enabled: boolean): void {
        for (const button of this._buttons) button.enabled = enabled;
    }

    private toAssetRelativePath(selectedPath: string): string | undefined {
        const assetsPath = Editor.assetsPath.replace(/\\/g, "/").replace(/\/+$/, "");
        const normalizedSelected = selectedPath.replace(/\\/g, "/").replace(/\/+$/, "");
        const assetsLower = assetsPath.toLowerCase();
        const selectedLower = normalizedSelected.toLowerCase();
        if (selectedLower !== assetsLower && !selectedLower.startsWith(`${assetsLower}/`)) return undefined;
        return normalizeAssetPath(normalizedSelected.slice(assetsPath.length));
    }

    private createUniqueRuleId(path: string): string {
        const base = path.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "texture-rule";
        const ids = new Set(this._draft.rules.map(rule => rule.id));
        if (!ids.has(base)) return base;
        let suffix = 2;
        while (ids.has(`${base}-${suffix}`)) suffix++;
        return `${base}-${suffix}`;
    }

    private cloneRules(rules: ReadonlyArray<TextureImportRuleData>): TextureImportRuleData[] {
        return rules.map(rule => ({ ...rule }));
    }

    private formatReport(title: string, report: TextureImportAuditReport): string {
        const lines = [
            title,
            `扫描：${report.scanned}　匹配：${report.matched}　自动图集：${report.atlasManaged}`,
            `需要修改：${report.needsChange}　已重导入：${report.applied}　未匹配：${report.unmatched}`,
        ];
        if (report.reimportedDependencies !== undefined) lines.push(`同步重导入依赖资源：${report.reimportedDependencies}`);
        if (report.invalidRules.length > 0) lines.push(`规则错误：\n${report.invalidRules.join("\n")}`);
        if (report.errors.length > 0) lines.push(`处理错误：\n${report.errors.join("\n")}`);
        if (report.changedPaths.length > 0) lines.push(`待修改样例：\n${report.changedPaths.slice(0, 12).join("\n")}`);
        return lines.join("\n");
    }

    private formatDirectoryReimportReport(title: string, report: TextureDirectoryReimportReport): string {
        const lines = [
            title,
            `规则目录：${report.directories}　资源总数：${report.assets}`,
            `图片：${report.images}　其他依赖资源：${report.otherAssets}`,
        ];
        if (report.invalidRules.length > 0) lines.push(`规则错误：\n${report.invalidRules.join("\n")}`);
        if (report.missingPaths.length > 0) lines.push(`目录不存在：\n${report.missingPaths.join("\n")}`);
        return lines.join("\n");
    }
}
