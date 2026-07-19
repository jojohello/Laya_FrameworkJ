Shader3D Start
{
    type: Shader3D,
    name: CharacterTeamColor2D,
    shaderType: 2,
    uniformMap: {
        u_TeamMask: { type: Texture2D, default: "black" },
        u_TeamColor: { type: Vector4, default: [1, 0, 0, 1] },
        u_BaseUV: { type: Vector4, default: [0, 0, 1, 1] },
        u_MaskUV: { type: Vector4, default: [0, 0, 1, 1] }
    },
    attributeMap: {
        a_posuv: Vector4,
        a_attribColor: Vector4,
        a_attribFlags: Vector4,
        a_customs: Vector4
    },
    defines: {
        TEXTUREVS: { type: bool, default: true, private: true }
    },
    shaderPass: [
        {
            pipeline: Forward,
            VS: characterTeamColorVS,
            FS: characterTeamColorPS
        }
    ]
}
Shader3D End

GLSL Start

#defineGLSL characterTeamColorVS
    #define SHADER_NAME CharacterTeamColor2D
    #include "Sprite2DVertex.glsl";

    void main() {
        vertexInfo info;
        getVertexInfo(info);

        v_texcoordAlpha = info.texcoordAlpha;
        v_color = info.color;
        v_useTex = info.useTex;
        v_useClip = info.useClip;
        v_customs = info.customs;
        gl_Position = getPosition(info.pos);
    }
#endGLSL

#defineGLSL characterTeamColorPS
    #define SHADER_NAME CharacterTeamColor2D
    #if defined(GL_FRAGMENT_PRECISION_HIGH)
        precision highp float;
    #else
        precision mediump float;
    #endif

    #include "Sprite2DFrag.glsl";

    void main() {
        clip();
        vec4 baseColor = getSpriteTextureColor();

        vec2 safeBaseSize = max(abs(u_BaseUV.zw), vec2(0.00001));
        vec2 localUV = (v_texcoordAlpha.xy - u_BaseUV.xy) / safeBaseSize;
        vec2 maskUV = u_MaskUV.xy + localUV * u_MaskUV.zw;
        float mask = smoothstep(0.06, 0.45, texture2D(u_TeamMask, maskUV).a);

        float luminance = dot(baseColor.rgb, vec3(0.299, 0.587, 0.114));
        float shade = mix(0.58, 1.18, luminance);
        vec3 teamColor = clamp(u_TeamColor.rgb * shade, 0.0, 1.0);
        baseColor.rgb = mix(baseColor.rgb, teamColor, mask);

        setglColor(baseColor);
    }
#endGLSL

GLSL End
