/** Material adapter for selective red/blue character recoloring. */
export class CharacterTeamColorMaterial {
    static readonly SHADER_PATH = "shaders/character-team-color.shader";
    static readonly SHADER_NAME = "CharacterTeamColor2D";

    static async ensureShaderRegistered(): Promise<boolean> {
        if (Laya.Shader3D.find(this.SHADER_NAME)) return true;

        try {
            const resource = await Laya.loader.load(this.SHADER_PATH, Laya.Loader.TEXT);
            const source = typeof resource === "string"
                ? resource
                : resource?.data;
            if (typeof source !== "string" || !source.trim()) {
                console.error(`[CharacterTeamColorMaterial] Shader 文本加载失败: path=${this.SHADER_PATH}, resourceType=${resource?.constructor?.name || typeof resource}`);
                return false;
            }

            Laya.ShaderParser.parse(source, "shaders/");
            const registered = !!Laya.Shader3D.find(this.SHADER_NAME);
            console.log(`[CharacterTeamColorMaterial] Shader 显式解析结果: registered=${registered}, bytes=${source.length}`);
            return registered;
        } catch (error) {
            console.error(`[CharacterTeamColorMaterial] Shader 显式解析异常: path=${this.SHADER_PATH}`, error);
            return false;
        }
    }

    static create(baseTexture: Laya.Texture, maskTexture: Laya.Texture): Laya.Material | null {
        if (!Laya.Shader3D.find(this.SHADER_NAME)) {
            console.error(`[CharacterTeamColorMaterial] Shader 未注册: ${this.SHADER_NAME}, path=${this.SHADER_PATH}`);
            return null;
        }

        const material = new Laya.Material();
        material.setShaderName(this.SHADER_NAME);
        material.materialRenderMode = Laya.MaterialRenderMode.RENDERMODE_TRANSPARENT;
        material.renderQueue = Laya.Material.RENDERQUEUE_TRANSPARENT;
        material.cull = Laya.CullMode.Off;
        material.depthTest = Laya.CompareFunction.Off;
        material.depthWrite = false;
        material.blend = Laya.BlendType.BLEND_ENABLE_ALL;
        // Sprite2DFrag outputs premultiplied RGB.
        material.blendSrc = Laya.BlendFactor.One;
        material.blendDst = Laya.BlendFactor.OneMinusSourceAlpha;
        material.setTexture("u_TeamMask", maskTexture.bitmap);
        material.setVector4("u_BaseUV", this.getUVRect(baseTexture));
        material.setVector4("u_MaskUV", this.getUVRect(maskTexture));
        material.setVector4("u_TeamColor", new Laya.Vector4(1, 0, 0, 1));
        return material;
    }

    static setTeamColor(material: Laya.Material, r: number, g: number, b: number): void {
        const normalize = (value: number): number => Math.max(0, Math.min(255, value)) / 255;
        material.setVector4("u_TeamColor", new Laya.Vector4(
            normalize(r),
            normalize(g),
            normalize(b),
            1
        ));
    }

    static setFrameTextures(material: Laya.Material, baseTexture: Laya.Texture, maskTexture: Laya.Texture): void {
        material.setTexture("u_TeamMask", maskTexture.bitmap);
        material.setVector4("u_BaseUV", this.getUVRect(baseTexture));
        material.setVector4("u_MaskUV", this.getUVRect(maskTexture));
    }

    private static getUVRect(texture: Laya.Texture): Laya.Vector4 {
        const uv = texture.uv;
        return new Laya.Vector4(
            uv[0],
            uv[1],
            uv[2] - uv[0],
            uv[5] - uv[1]
        );
    }
}
