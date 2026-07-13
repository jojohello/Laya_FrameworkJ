/**
 * 资源配置数据（简单数据类）
 * 规则：只包含基础类型（number/string/boolean）
 */
export class ResourceData {
    url: string = "";              // 资源路径
    cacheTime: number = 5000;      // 缓存时间（毫秒）
    poolLimit: number = 3;         // 对象池上限
}
