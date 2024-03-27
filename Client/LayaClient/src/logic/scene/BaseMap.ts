// jojohello 2023/05/22
// 场景的地图组件，用于管理地图的显示、坐标移动、模块信息等

export class BaseMap{
    protected tMap:Laya.TiledMap = null;
    protected resPath:string = "";
    protected viewRect:Laya.Rectangle = null;

    public loadMapRes(mapName:string, handle:()=>void)
    {   
        this.resPath = mapName;

        // 根据不同的地图资源，加载方式可能不一样
        this.tMap = new Laya.TiledMap();

		this.viewRect = new Laya.Rectangle(0, 0, Laya.stage.width, Laya.stage.height);
		this.tMap.createMap(mapName, this.viewRect, Laya.Handler.create(this, ()=>{
            this.viewRect.width = this.tMap.width * this.tMap.tileWidth;
            this.viewRect.height = this.tMap.height * this.tMap.tileHeight;
            this.tMap.changeViewPort(this.viewRect.x, this.viewRect.y, this.viewRect.width, this.viewRect.height);
            if(handle)
                handle();
            }));
    }

    public getWidth():number{ return this.tMap.width; }
    public getHeight():number{ return this.tMap.height; }
    public getGridHeight():number{ return this.tMap.tileHeight; }
    public getGridWidth():number{ return this.tMap.tileWidth; }
    public getTileWidth():number{ return this.tMap.tileWidth; }
    public getTileHeight():number{ return this.tMap.tileHeight; }

    public getTiledMap():Laya.TiledMap{ return this.tMap; }
    public getTileMapViewRect():Laya.Rectangle{ return this.viewRect; }
}