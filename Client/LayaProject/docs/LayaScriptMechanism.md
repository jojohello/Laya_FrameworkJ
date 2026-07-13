# LayaAir Script 机制详解

## 概述

LayaAir 3.0 采用 **ECS (Entity-Component-System)** 架构，Script 是其核心组件机制。

## 核心概念

### 1. Script 类

```typescript
export class MyScript extends Laya.Script {
    // Script 是组件的基类
}
```

**特点：**
- 继承自 `Laya.Script`
- 可以挂载到场景节点上
- 拥有完整的生命周期
- 可以在 IDE 中可视化配置

### 2. @regClass() 装饰器

```typescript
const { regClass, property } = Laya;

@regClass()
export class MyScript extends Laya.Script {
    // ...
}
```

**作用：**
- **注册类到引擎**：让 LayaAir IDE 识别这个类
- **启用反射**：允许 IDE 在运行时创建实例
- **必须使用**：没有 `@regClass()` 的类无法在 IDE 中使用

### 3. @property() 装饰器

```typescript
@regClass()
export class MyScript extends Laya.Script {
    /** 在 IDE 中可配置的字符串属性 */
    @property(String)
    public myText: string = "默认值";
    
    /** 在 IDE 中可配置的数字属性 */
    @property(Number)
    public myNumber: number = 100;
    
    /** 在 IDE 中可配置的布尔属性 */
    @property(Boolean)
    public isEnabled: boolean = true;
    
    /** 在 IDE 中可配置的节点引用 */
    @property(Laya.Sprite)
    public targetSprite: Laya.Sprite;
}
```

**支持的类型：**
- `String` - 字符串
- `Number` - 数字
- `Boolean` - 布尔值
- `Laya.Sprite` - 节点引用
- `Laya.Texture2D` - 纹理
- 其他 Laya 类型

## Script 生命周期

### 完整生命周期顺序

```typescript
@regClass()
export class MyScript extends Laya.Script {
    
    /**
     * 1. 构造函数
     * 时机：脚本实例被创建时
     * 注意：此时 owner 还未赋值，不要访问 owner
     */
    constructor() {
        super();
        console.log("constructor");
    }
    
    /**
     * 2. onAwake
     * 时机：脚本被添加到节点后，第一次激活时调用
     * 用途：初始化数据、获取组件引用
     * 注意：只调用一次
     */
    onAwake(): void {
        console.log("onAwake");
        // 此时可以安全访问 this.owner
    }
    
    /**
     * 3. onEnable
     * 时机：脚本或节点被激活时
     * 用途：注册事件监听、启动定时器
     * 注意：可能被多次调用（每次激活都会调用）
     */
    onEnable(): void {
        console.log("onEnable");
        // 绑定事件
        Laya.stage.on(Laya.Event.CLICK, this, this.onClick);
    }
    
    /**
     * 4. onStart
     * 时机：第一次 update 之前
     * 用途：在所有脚本的 onAwake 都执行完后的初始化
     * 注意：只调用一次
     */
    onStart(): void {
        console.log("onStart");
    }
    
    /**
     * 5. onUpdate
     * 时机：每帧调用
     * 用途：游戏逻辑更新
     */
    onUpdate(): void {
        // 每帧执行
    }
    
    /**
     * 6. onLateUpdate
     * 时机：所有 onUpdate 执行完后
     * 用途：相机跟随等需要在 update 后执行的逻辑
     */
    onLateUpdate(): void {
        // 在 update 之后执行
    }
    
    /**
     * 7. onDisable
     * 时机：脚本或节点被禁用时
     * 用途：移除事件监听、清理定时器
     * 注意：可能被多次调用
     */
    onDisable(): void {
        console.log("onDisable");
        // 移除事件
        Laya.stage.off(Laya.Event.CLICK, this, this.onClick);
    }
    
    /**
     * 8. onDestroy
     * 时机：脚本被销毁时（节点被销毁或脚本被移除）
     * 用途：释放资源、清理引用
     * 注意：只调用一次
     */
    onDestroy(): void {
        console.log("onDestroy");
        // 释放资源
    }
    
    private onClick(): void {
        console.log("clicked");
    }
}
```

### 生命周期调用顺序示例

```
场景加载：
constructor → onAwake → onEnable → onStart → onUpdate (每帧) → onLateUpdate (每帧)

节点禁用：
onDisable

节点重新激活：
onEnable → onUpdate (每帧) → onLateUpdate (每帧)

节点销毁：
onDisable → onDestroy
```

## Script vs Scene

### Laya.Script（组件脚本）

```typescript
@regClass()
export class MyComponent extends Laya.Script {
    declare owner: Laya.Sprite;  // 挂载的节点
    
    onAwake(): void {
        // 可以访问 owner
        console.log(this.owner.name);
    }
}
```

**特点：**
- ✅ 需要 `@regClass()` 注册
- ✅ 可以在 IDE 中拖拽到节点上
- ✅ 可以使用 `@property()` 暴露属性
- ✅ 有完整的生命周期
- ✅ 可复用（多个节点可以挂载同一个脚本类）

**使用场景：**
- UI 交互逻辑
- 游戏对象行为
- 可复用的组件

### Laya.Scene（场景类）

```typescript
export class MyScene extends Laya.Scene {
    onEnable(): void {
        // 场景激活时
    }
    
    onDisable(): void {
        // 场景禁用时
    }
}
```

**特点：**
- ❌ 不需要 `@regClass()`（通常）
- ❌ 不能拖拽到其他节点
- ✅ 可以直接作为场景根节点
- ✅ 有生命周期（但比 Script 少）

**使用场景：**
- 场景入口
- 场景级别的管理器
- 不需要复用的单例场景

## 最佳实践

### 1. 初始化顺序

```typescript
@regClass()
export class MyScript extends Laya.Script {
    @property(String)
    public resourceUrl: string = "";
    
    private _data: any;
    
    // ❌ 错误：在 constructor 中访问 owner
    constructor() {
        super();
        // this.owner.name;  // 错误！owner 还未赋值
    }
    
    // ✅ 正确：在 onAwake 中初始化
    onAwake(): void {
        this._data = {};
        console.log(this.owner.name);  // 正确
    }
    
    // ✅ 正确：在 onEnable 中注册事件
    onEnable(): void {
        Laya.stage.on(Laya.Event.CLICK, this, this.onClick);
    }
    
    // ✅ 正确：在 onDisable 中移除事件
    onDisable(): void {
        Laya.stage.off(Laya.Event.CLICK, this, this.onClick);
    }
}
```

### 2. 事件管理

```typescript
@regClass()
export class EventScript extends Laya.Script {
    onEnable(): void {
        // 注册事件时，使用 this 作为 caller
        Laya.stage.on(Laya.Event.CLICK, this, this.onClick);
    }
    
    onDisable(): void {
        // 移除事件时，必须传入相同的 caller
        Laya.stage.off(Laya.Event.CLICK, this, this.onClick);
    }
    
    private onClick(): void {
        console.log("clicked");
    }
}
```

### 3. 资源管理

```typescript
@regClass()
export class ResourceScript extends Laya.Script {
    @property(String)
    public imageUrl: string = "";
    
    private _sprite: Laya.Sprite;
    
    async onEnable(): Promise<void> {
        // 加载资源
        await Laya.loader.load(this.imageUrl);
        this._sprite = new Laya.Sprite();
        this.owner.addChild(this._sprite);
    }
    
    onDisable(): void {
        // 清理资源
        if (this._sprite) {
            this._sprite.destroy();
            this._sprite = null;
        }
    }
}
```

### 4. 定时器管理

```typescript
@regClass()
export class TimerScript extends Laya.Script {
    onEnable(): void {
        // 使用 this 作为 caller，方便清理
        Laya.timer.loop(1000, this, this.onTimer);
    }
    
    onDisable(): void {
        // 清理定时器
        Laya.timer.clear(this, this.onTimer);
    }
    
    private onTimer(): void {
        console.log("timer tick");
    }
}
```

## 常见问题

### Q1: 为什么我的脚本在 IDE 中看不到？

**A:** 确保使用了 `@regClass()` 装饰器：

```typescript
const { regClass } = Laya;

@regClass()  // 必须有这个
export class MyScript extends Laya.Script {
    // ...
}
```

### Q2: 为什么属性在 IDE 中不显示？

**A:** 确保使用了 `@property()` 装饰器：

```typescript
@property(String)  // 必须有这个
public myText: string = "";
```

### Q3: Script 和 Scene 有什么区别？

**A:**
- **Script**: 组件，可以挂载到任何节点，可复用
- **Scene**: 场景根节点，通常不复用

### Q4: 什么时候用 onAwake，什么时候用 onEnable？

**A:**
- **onAwake**: 只执行一次的初始化（创建对象、获取引用）
- **onEnable**: 可能多次执行的初始化（注册事件、启动定时器）

### Q5: 如何在脚本中访问其他节点？

```typescript
@regClass()
export class MyScript extends Laya.Script {
    @property(Laya.Sprite)
    public targetNode: Laya.Sprite;  // 在 IDE 中拖拽赋值
    
    onAwake(): void {
        // 方法1: 通过 IDE 拖拽赋值
        console.log(this.targetNode);
        
        // 方法2: 通过路径查找
        const node = this.owner.getChildByName("NodeName");
        
        // 方法3: 通过父节点查找
        const parent = this.owner.parent;
    }
}
```

## 总结

LayaAir Script 机制的核心要点：

1. **@regClass()** - 必须使用，让 IDE 识别类
2. **@property()** - 暴露属性到 IDE
3. **生命周期** - 理解调用顺序，在正确的时机做正确的事
4. **事件管理** - onEnable 注册，onDisable 移除
5. **资源管理** - 及时清理，避免内存泄漏
6. **Script vs Scene** - 根据需求选择合适的基类
