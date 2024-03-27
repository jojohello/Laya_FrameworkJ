export class CfgMgr {
    private static _instance: CfgMgr;

    public static get inst(): CfgMgr {
        if (!CfgMgr._instance) {
            CfgMgr._instance = new CfgMgr();
        }
        return CfgMgr._instance;
    }

    private _isInit: boolean = false;
    private _useZip: boolean = false;
    private _zip: any = null;
    private _zipFilesContents: Map<string, string> = new Map<string, string>();
    private _tableMap: Map<string, any> = new Map<string, any>();

    readonly File_Path = "res/cfg/";
    readonly File_Ext = ".csv";

    // 配置必须加载完毕之后，游戏才能进行下一步
    public init(handle :()=>void) {
        if(this._useZip){
            Laya.loader.load(this.File_Path + "cfg.data", Laya.Handler.create(this, (data:any)=>{
                const arrayBuffer = new Uint8Array(data).buffer;

                this._zip = new Laya.Browser.window.JSZip();
                // , { password: 'jojohello'}
                this._zip.loadAsync(arrayBuffer, {}).then((zip) => {
                    let fileList = Object.keys(this._zip.files);
                    let fileCount = 0;
                    zip.forEach(
                        (relativePath, zipEntry) => {
                            if(zipEntry.dir)
                                return;

                            fileCount++;
                            zipEntry.async("string").then((data)=>{
                                let fileName = zipEntry.name;
                                let tableName = fileName.substr(0, fileName.length - 4);
                                this._zipFilesContents.set(tableName, data);

                                fileCount--;
                                if(fileCount == 0){
                                    this._isInit = true;
                                    if(handle)
                                        handle();
                                }
                            });
                        }
                    );
                });
            }), null, Laya.Loader.BUFFER);
        }else{
            let csvList:string[] = 
            [
                "res/cfg/Bullet.csv",
                "res/cfg/Monster.csv",
                "res/cfg/Skill.csv",
                "res/cfg/BattleMap.csv",
                "res/cfg/Producer.csv",
                "res/cfg/AttrDef.csv",
            ]

            Laya.loader.load(csvList, Laya.Handler.create(this, () => {
                this._isInit = true;
                if(handle)
                    handle();
            }));
        }
    }

    public getTable(tableName: string): any {
        if(!this._isInit)
        {
            console.error("CfgMgr.getTable() error, CfgMgr is not init");
            return null;
        }
            
        let filePath = tableName;
        if(!this._useZip)
            filePath = this.File_Path + filePath + this.File_Ext;
        if (!this._tableMap.has(filePath)) {
            this.initTable(filePath);
        }

        if (!this._tableMap.has(filePath)) {
            console.error("CfgMgr.getTable() error, tableName is not exist", filePath);
            return null;
        }

        return this._tableMap.get(filePath);
    }

    public getCfg(tableName: string, key: any): any {
        let table = this.getTable(tableName);
        if (!table) {
            console.error("CfgMgr.getTableItem() error, tableName is not exist", tableName);
            return null;
        }

        return table.get(key);
    }

    private initTable(tablePath: string) {
        let content = null
        if(this._useZip){ // 从zip文件中获取内容
            content = this._zipFilesContents.get(tablePath);
        }else{
            content = Laya.loader.getRes(tablePath);
        }

        if (!content) {
            console.error("CfgMgr.initTable() error, tableName is not exist", tablePath);
            return;
        }
        
        
        let lines = content.split("\n");
        // 第一行为标题名
        let titles:string[] = lines[0].replace("\n", "").replace("\r", "").split(",");
        // 第二列是类型
        let types:string[] = lines[1].replace("\n", "").replace("\r", "").split(",");

        let map = this.createMap(types);
        // 第五行开始是正式表格数据
        let line = "";
        let value = null;
        for(let i = 4; i < lines.length; i++){
            if(lines[i] == "")
                continue;

            line = lines[i].replace("\n", "").replace("\r", "");
            value = this.parseValueToMap(line, titles, types);
            map.set(value[titles[1]], value);
        }

        this._tableMap.set(tablePath, map);

        if(this._useZip){
            this._zipFilesContents.delete(tablePath);
        }
    }

    private createMap(types:string[]): Map<any, any>{
        let keyType = types[1];
        switch(keyType){
            case "int":
                return new Map<number, any>();
            default :
                return new Map<string, any>();
        }
    }

    private parseValueToMap(line:string, titles:string[], types:string[]): any{
        let ret = {};
        let values = line.split(",");
        for (let i = 1; i < titles.length; i++) {
            let title = titles[i];
            let value = values[i];
            let type = types[i];
            switch (type) {
                case "int":
                    ret[title] = parseInt(value);
                    break;
                case "str":
                    ret[title] = value;
                    break;
                case "bool":
                    ret[title] = value == "1" || value.toLowerCase() == "true";
                    break;
                case "float":
                    ret[title] = parseFloat(value);
                    break;
            }
        }

        return ret;
    }
}