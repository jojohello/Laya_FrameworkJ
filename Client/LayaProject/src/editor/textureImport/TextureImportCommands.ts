import { TextureImportRuleService } from "./TextureImportRuleService";
import { TextureDirectoryReimportReport, TextureImportAuditReport } from "./TextureImportTypes";

/** JSON-safe Scene-process commands invoked by the editor UI. */
@IEditorEnv.regClass()
export class TextureImportCommands {
    static audit(): Promise<TextureImportAuditReport> {
        return TextureImportRuleService.audit();
    }

    static applyAndReimport(): Promise<TextureImportAuditReport> {
        return TextureImportRuleService.applyAndReimport();
    }

    static inspectConfiguredDirectories(): Promise<TextureDirectoryReimportReport> {
        return TextureImportRuleService.inspectConfiguredDirectories();
    }

    static reimportConfiguredDirectories(): Promise<TextureDirectoryReimportReport> {
        return TextureImportRuleService.reimportConfiguredDirectories();
    }
}
