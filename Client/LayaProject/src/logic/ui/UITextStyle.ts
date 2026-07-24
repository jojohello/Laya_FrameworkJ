import { ConfigMgr } from "../config/ConfigMgr";

export interface UITextStyleConfig {
    ID: number;
    Key: string;
    Usage: string;
    Font: string;
    FontSize: number;
    Color: string;
    Bold: boolean;
    Stroke: number;
    StrokeColor: string;
    Align: string;
    VAlign: string;
}

interface TextStyleTarget {
    font?: string;
    fontSize: number;
    color: string;
    bold: boolean;
    stroke: number;
    strokeColor: string;
    align: string;
    valign: string;
}

/**
 * Applies semantic text styles exported from Config/csv/UITextStyle.csv.
 *
 * Serialized .ls/.lh text nodes copy these values while assembling the UI in
 * LayaAir IDE. Runtime-created or stateful text uses this helper so it does not
 * duplicate colors, font sizes or stroke values in TypeScript.
 */
export class UITextStyle {
    private static readonly TABLE_NAME = "UITextStyle";

    static get(styleKey: string): UITextStyleConfig | null {
        if (!styleKey) return null;
        return ConfigMgr.instance.getFirstByField<UITextStyleConfig>(
            UITextStyle.TABLE_NAME,
            "Key",
            styleKey
        );
    }

    static apply(target: TextStyleTarget | null | undefined, styleKey: string): boolean {
        if (!target) return false;

        const style = UITextStyle.get(styleKey);
        if (!style) {
            console.warn(`[UITextStyle] Missing style: ${styleKey}`);
            return false;
        }

        if (style.Font) target.font = style.Font;
        target.fontSize = style.FontSize;
        target.color = style.Color;
        target.bold = style.Bold;
        target.stroke = style.Stroke;
        target.strokeColor = style.StrokeColor;
        target.align = style.Align;
        target.valign = style.VAlign;
        return true;
    }
}
