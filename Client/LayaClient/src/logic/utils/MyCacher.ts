// jojohello 2023-7-23 用来缓存自己写的类实例，Laya资源使用Laya.pool来缓存
export default class MyCacher {
    private static  _cacheMap:Map<string, any[]> = new Map<string, any[]>();

    // 为了性能考虑，不使用变长参数作为初始化参数，初始化的代码都在外面调用
    public static  getObj(className:string):any {
        if (MyCacher._cacheMap.has(className)
            && MyCacher._cacheMap.get(className).length > 0) {
          return MyCacher._cacheMap.get(className).pop();
        }
        
        // 这意味着，能被cache管理的类，必须是已注册到Laya.ClassUtils的类
        return Laya.ClassUtils.getInstance(className);
    }

    public static  recycleObj(obj:any):void {
        let className = obj.constructor.name;
        if (!MyCacher._cacheMap.has(className)) {
            MyCacher._cacheMap.set(className, []);
        }

        MyCacher._cacheMap.get(className).push(obj);
        // 考虑到释放方式的多样性，也不在这里调用onRelease
    }
}
