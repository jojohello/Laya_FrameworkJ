// jojohello   2023-05-16
// 用来设定值，然后在主包以及分包之间进行值传递

export class MyGobalValue{
    private static value:Map<string, any> = new Map<string, any>()

    public static setValue(key:string, value:any){
        this.value.set(key, value)
    }

    public static getValue(key:string):any{
        return this.value.get(key)
    }

    public static init() {

    }

    // 为了可读性，还是建议使用下面的方法，虽然会增加很多重复代码
    // 不过我也认为这种全局的变量不宜过多

    public static get isWX():boolean {
        if (this.value.get("isWX") == null) {
            if (Laya.Browser.onMiniGame) {
                this.value.set("isWX", true);
            } else {
                this.value.set("isWX", false);
            }
        }

        return this.value.get("isWX");
    }

    /**
     * name
     */
    public static get cdn() {
        if (this.value.get("cdn") == null) {
            if (Laya.Browser.window.params.cdnURL != null) {
                this.value.set("cdn", Laya.Browser.window.params.cdnURL);
            } else {
                this.value.set("cdn", "");
            }
        }

        return this.value.get("cdn");
    }

    public static get version():string {
        if (this.value.get("version") == null) {
            if (Laya.Browser.window.version != null) {
                this.value.set("version", Laya.Browser.window.version);
            } else {
                this.value.set("version", "0");
            }
        }

        return this.value.get("version");
    }
}

Laya["MyGobalValue"] = MyGobalValue;