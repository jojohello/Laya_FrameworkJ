/** Reimports moved images so their new directory rule is applied even if the IDE only updates the path. */
export class TextureImportMoveWatcher {
    @IEditorEnv.onLoad
    static onLoad(): void {
        EditorEnv.assetMgr.onAssetChanged.add(this.onAssetChanged, this);
    }

    @IEditorEnv.onUnload
    static onUnload(): void {
        EditorEnv.assetMgr.onAssetChanged.remove(this.onAssetChanged, this);
    }

    private static onAssetChanged(asset: IEditorEnv.IAssetInfo, flag: IEditorEnv.AssetChangedFlag): void {
        if (flag !== IEditorEnv.AssetChangedFlag.Moved || asset.type !== IEditorEnv.AssetType.Image) return;
        EditorEnv.assetMgr.importAsset(asset, ["texture-import-rules-moved"]);
    }
}
