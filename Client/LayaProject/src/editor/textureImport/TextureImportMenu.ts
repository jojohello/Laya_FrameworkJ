import { TextureImportDialog } from "./TextureImportSettingsPanel";
import "./TextureImportSettingsRegistration";

/** Single tool-menu entry for the texture configuration window. */
export class TextureImportMenu {
    @IEditor.menu("App/tool/openTextureImportRules", { label: "纹理配置" })
    static async openSettings(): Promise<void> {
        await Editor.showDialog(TextureImportDialog);
    }
}
