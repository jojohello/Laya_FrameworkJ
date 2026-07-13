/**
 * Lightweight runtime attribute container for creatures.
 */
export class AttributeSet {
    static readonly PERCENT_BASE: number = 10000;

    private _baseValues: Map<string, number> = new Map();
    private _addValues: Map<string, number> = new Map();
    private _percentValues: Map<string, number> = new Map();
    private _finalValues: Map<string, number> = new Map();
    private _directValues: Map<string, number> = new Map();
    private _directAttrs: Set<string> = new Set();
    private _percentToAttr: Map<string, string> = new Map();

    markDirectAttr(name: string): void {
        this._directAttrs.add(name);
    }

    bindPercentAttr(attrName: string, percentAttrName: string): void {
        this._percentToAttr.set(percentAttrName, attrName);
    }

    setBase(name: string, value: number, syncCurrent: boolean = false): void {
        if (!this.canModifyComputedAttr(name)) return;

        this._baseValues.set(name, this.toInt(value));
        this.recalc(name);

        if (syncCurrent) {
            // Kept for old call sites; direct runtime values should use setValue().
        }
    }

    getBase(name: string, defaultValue: number = 0): number {
        return this._baseValues.get(name) ?? defaultValue;
    }

    setAdd(name: string, value: number): void {
        if (!this.canModifyComputedAttr(name)) return;

        this._addValues.set(name, this.toInt(value));
        this.recalc(name);
    }

    getAdd(name: string, defaultValue: number = 0): number {
        return this._addValues.get(name) ?? defaultValue;
    }

    addAdd(name: string, delta: number): number {
        this.setAdd(name, this.getAdd(name) + delta);
        return this.getAdd(name);
    }

    setPercent(name: string, value: number): void {
        const attrName = this.resolvePercentAttr(name);
        if (!this.canModifyComputedAttr(attrName)) return;

        this._percentValues.set(attrName, this.toInt(value));
        this.recalc(attrName);
    }

    getPercent(name: string, defaultValue: number = 0): number {
        return this._percentValues.get(this.resolvePercentAttr(name)) ?? defaultValue;
    }

    addPercent(name: string, delta: number): number {
        this.setPercent(name, this.getPercent(name) + delta);
        return this.getPercent(name);
    }

    getFinal(name: string, defaultValue: number = 0): number {
        if (this._directAttrs.has(name)) {
            return this.getValue(name, defaultValue);
        }

        return this._finalValues.get(name) ?? defaultValue;
    }

    setValue(name: string, value: number): void {
        this.markDirectAttr(name);
        this._directValues.set(name, this.toInt(value));
    }

    getValue(name: string, defaultValue: number = 0): number {
        return this._directValues.get(name) ?? defaultValue;
    }

    changeValue(name: string, delta: number): number {
        this.markDirectAttr(name);
        const nextValue = this.getValue(name) + delta;
        this.setValue(name, nextValue);
        return this.getValue(name);
    }

    set(name: string, value: number): void {
        this.setValue(name, value);
    }

    get(name: string, defaultValue: number = 0): number {
        return this._directAttrs.has(name)
            ? this.getValue(name, defaultValue)
            : this.getFinal(name, defaultValue);
    }

    add(name: string, delta: number): number {
        return this.changeValue(name, delta);
    }

    clear(): void {
        this._baseValues.clear();
        this._addValues.clear();
        this._percentValues.clear();
        this._finalValues.clear();
        this._directValues.clear();
        this._directAttrs.clear();
        this._percentToAttr.clear();
    }

    private recalc(name: string): void {
        const baseValue = this.getBase(name);
        const addValue = this.getAdd(name);
        const percentValue = this.getPercent(name);
        const finalValue = Math.ceil((baseValue + addValue) * (AttributeSet.PERCENT_BASE + percentValue) / AttributeSet.PERCENT_BASE);
        this._finalValues.set(name, finalValue);
    }

    private resolvePercentAttr(name: string): string {
        return this._percentToAttr.get(name) ?? name;
    }

    private canModifyComputedAttr(name: string): boolean {
        if (!this._directAttrs.has(name)) return true;

        console.warn(`[AttributeSet] direct attr can not use computed modifiers: ${name}`);
        return false;
    }

    private toInt(value: number): number {
        return Math.ceil(value);
    }
}
