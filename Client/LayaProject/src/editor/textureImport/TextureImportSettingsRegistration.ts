import {
    TEXTURE_FORMAT_OPTIONS,
    cloneDefaultTextureImportRules,
    createTextureImportRule,
    PC_TEXTURE_FORMAT_OPTIONS,
    TEXTURE_IMPORT_RULE_TYPE,
    TEXTURE_IMPORT_SETTINGS_NAME,
    TEXTURE_IMPORT_SETTINGS_TYPE,
    TextureImportSettingsData,
} from "./TextureImportTypes";

/** Registers project-owned texture import settings before Scene-process hooks request them. */
export class TextureImportSettingsRegistration {
    @IEditor.onLoad
    static onLoad(): void {
        Editor.typeRegistry.addTypes([
            {
                name: TEXTURE_IMPORT_RULE_TYPE,
                caption: "纹理目录规则",
                properties: [
                    { name: "id", type: "string", default: "new-rule", caption: "规则 ID", required: true },
                    { name: "enabled", type: "boolean", default: true, caption: "启用" },
                    {
                        name: "path",
                        type: "string",
                        default: "",
                        caption: "资源目录",
                        tips: "相对于 assets 的目录，不要添加 assets/ 前缀。",
                        required: true,
                    },
                    { name: "recursive", type: "boolean", default: true, caption: "包含子目录" },
                    {
                        name: "skipWhenAtlasManaged",
                        type: "boolean",
                        default: true,
                        caption: "跳过自动图集资源",
                        tips: "只跳过尺寸、纹理类型和递归范围都实际符合 AtlasConfig 的图片。",
                    },
                    {
                        name: "pcFormat",
                        type: "string",
                        default: "R8G8B8A8",
                        caption: "PC 格式",
                        enumSource: PC_TEXTURE_FORMAT_OPTIONS.map(option => ({ ...option })),
                    },
                    {
                        name: "androidFormat",
                        type: "string",
                        default: "ASTC_6X6",
                        caption: "Android 格式",
                        enumSource: TEXTURE_FORMAT_OPTIONS.map(option => ({ ...option })),
                    },
                    {
                        name: "iosFormat",
                        type: "string",
                        default: "ASTC_6X6",
                        caption: "iOS 格式",
                        enumSource: TEXTURE_FORMAT_OPTIONS.map(option => ({ ...option })),
                    },
                    {
                        name: "quality",
                        type: "number",
                        default: 1,
                        caption: "压缩质量",
                        tips: "0=低，1=普通，2=高。",
                        min: 0,
                        max: 2,
                        step: 1,
                        fractionDigits: 0,
                    },
                ],
            },
            {
                name: TEXTURE_IMPORT_SETTINGS_TYPE,
                caption: "纹理导入规则",
                catalogBarStyle: "hidden",
                properties: [
                    { name: "version", type: "number", default: 1, caption: "规则版本", readonly: true },
                    {
                        name: "rules",
                        type: [TEXTURE_IMPORT_RULE_TYPE],
                        default: cloneDefaultTextureImportRules(),
                        caption: "目录规则",
                        elementProps: { default: createTextureImportRule() },
                    },
                ],
            },
        ]);
        Editor.extensionManager.createSettings(TEXTURE_IMPORT_SETTINGS_NAME, "project", TEXTURE_IMPORT_SETTINGS_TYPE);

        const data = Editor.getSettings(TEXTURE_IMPORT_SETTINGS_NAME).data as Partial<TextureImportSettingsData>;
        if (!Number.isInteger(data.version)) data.version = 1;
        if (!Array.isArray(data.rules)) data.rules = cloneDefaultTextureImportRules();
    }
}
