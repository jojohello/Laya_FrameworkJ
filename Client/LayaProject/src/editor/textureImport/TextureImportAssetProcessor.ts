import { TextureImportRuleService } from "./TextureImportRuleService";

/** Applies project-owned texture rules before Laya writes importer metadata. */
@IEditorEnv.regAssetProcessor()
export class TextureImportAssetProcessor implements IEditorEnv.IAssetProcessor {
    async onPreprocessImage(assetImporter: IEditorEnv.IImageAssetImporter): Promise<void> {
        const decision = await TextureImportRuleService.preprocessImage(assetImporter);
        if (decision.error) {
            console.warn(`[TextureImportRules] ${decision.assetPath}: ${decision.error}`);
        }
    }
}
