/** Material adapter for selective red/blue character recoloring. */
export class CharacterTeamColorMaterial {
    static readonly SHADER_PATH = "shaders/character-team-color.shader";
    static readonly SHADER_NAME = "CharacterTeamColor2D";
    private static readonly TEAM_SHADER_NAMES: Readonly<Record<number, string>> = {
        1: "CharacterTeamColor2D_Blue",
        2: "CharacterTeamColor2D_Red",
    };

    static async ensureShaderRegistered(): Promise<boolean> {
        const shaderNames = [
            this.SHADER_NAME,
            ...Object.values(this.TEAM_SHADER_NAMES),
        ];
        if (shaderNames.every(name => !!Laya.Shader3D.find(name))) return true;

        try {
            const resource = await Laya.loader.load(this.SHADER_PATH, Laya.Loader.TEXT);
            const source = typeof resource === "string"
                ? resource
                : resource?.data;
            if (typeof source !== "string" || !source.trim()) {
                console.error(`[CharacterTeamColorMaterial] Shader text load failed: path=${this.SHADER_PATH}, resourceType=${resource?.constructor?.name || typeof resource}`);
                return false;
            }

            const sources = [
                { name: this.SHADER_NAME, source },
                ...Object.values(this.TEAM_SHADER_NAMES).map(name => ({
                    name,
                    source: this.makeShaderVariant(source, name),
                })),
            ];
            for (const item of sources) {
                if (!Laya.Shader3D.find(item.name)) {
                    Laya.ShaderParser.parse(item.source, "shaders/");
                }
            }

            const registered = shaderNames.every(name => !!Laya.Shader3D.find(name));
            console.log(`[CharacterTeamColorMaterial] Shader registration: registered=${registered}, shaders=${shaderNames.join(",")}, bytes=${source.length}`);
            return registered;
        } catch (error) {
            console.error(`[CharacterTeamColorMaterial] Shader registration failed: path=${this.SHADER_PATH}`, error);
            return false;
        }
    }

    static create(baseTexture: Laya.Texture, maskTexture: Laya.Texture, team: number = 0): Laya.Material | null {
        const shaderName = this.getShaderName(team);
        if (!Laya.Shader3D.find(shaderName)) {
            console.error(`[CharacterTeamColorMaterial] Shader is not registered: ${shaderName}, path=${this.SHADER_PATH}`);
            return null;
        }

        const material = new Laya.Material();
        material.setShaderName(shaderName);
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

    static getShaderName(team: number): string {
        return this.TEAM_SHADER_NAMES[team] || this.SHADER_NAME;
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

    private static makeShaderVariant(source: string, shaderName: string): string {
        const suffix = shaderName.replace(`${this.SHADER_NAME}_`, "");
        return source
            .replace(/CharacterTeamColor2D/g, shaderName)
            .replace(/characterTeamColorVS/g, `characterTeamColorVS_${suffix}`)
            .replace(/characterTeamColorPS/g, `characterTeamColorPS_${suffix}`);
    }
}
