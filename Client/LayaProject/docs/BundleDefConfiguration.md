# BundleDef 配置说明

## ✅ 已完成的配置

### 1. BundleDef 文件配置

文件位置：[src/logic/LogicLib.bundledef](../src/logic/LogicLib.bundledef)

```json
{
  "enabled": true,
  "allowLoadInEditor": true,
  "allowLoadInRuntime": true,
  "autoLoad": false,           // ← 设置为 false，禁止自动加载
  "entries": [...],
  "includeAllFiles": false,
  "loadBeforeMain": false,     // ← 不在主包之前加载
  "bundleExternals": false
}
```

**关键配置**：
- `autoLoad: false` - 禁止自动加载，需要手动调用 `Laya.loader.loadPackage()` 加载
- `loadBeforeMain: false` - 不在主包之前加载

### 2. BuildSettings.json 配置

文件位置：[settings/BuildSettings.json](../settings/BuildSettings.json)

```json
{
  "enableSubpackages": true,
  "subpackages": [
    {
      "path": "logic",
      "mainScript": "res://fab2a401-bee2-4db4-bade-e3966699346e"  // ← LogicLib.bundledef 的 UUID
    }
  ]
}
```

### 3. 文件关联

```
src/logic/LogicLib.bundledef
    ↓ (UUID)
src/logic/LogicLib.bundledef.meta
    ↓ (包含 UUID: fab2a401-bee2-4db4-bade-e3966699346e)
settings/BuildSettings.json
    ↓ (通过 mainScript 引用此 UUID)
assets/logic/ 作为本地分包资源锚点
    ↓ (发布为 logic/)
分包配置生效
```

---

## 🧪 测试步骤

### Step 1: 在 LayaAir IDE 中发布

1. 打开 LayaAir IDE
2. 点击 `发布` → `Web 平台`（或 Ctrl+F7）
3. 等待构建完成

### Step 2: 检查输出目录

**预期目录结构**：

```
release/web/
├── index-xxxxx.html
├── bundle-xxxxx.js           ← 主包代码（包含 Start 模块）
├── LogicLib-xxxxx.js         ← Logic 分包代码 ✅ 关键！
└── fileconfig-xxxxx.json
```

**检查命令（PowerShell）**：

```powershell
cd e:\Laya_FrameworkJ_laya3\Client\LayaProject\release\web
ls *.js
```

**预期输出**：

```
bundle-xxxxx.js      # 主包
LogicLib-xxxxx.js    # Logic 分包 ← 如果看到这个文件，说明分包成功！
```

### Step 3: 检查文件内容（可选）

```powershell
# 查看 LogicLib-xxxxx.js 的大小
ls LogicLib-*.js

# 快速验证文件是否包含 Logic 模块的代码
Select-String -Path "LogicLib-*.js" -Pattern "LogicMain" -List
```

---

## ✅ 成功的标志

1. **文件生成**：
   - ✅ `release/web/bundle-xxxxx.js` 存在（主包）
   - ✅ `release/web/LogicLib-xxxxx.js` 存在（Logic 分包）

2. **大小对比**：
   - 主包（bundle.js）应该比之前小（不包含 Logic 模块代码）
   - LogicLib.js 应该包含 src/logic/ 下的所有代码

3. **运行时行为**（后续测试）：
   - 游戏启动时不加载 LogicLib.js
   - 登录成功后调用 `Laya.loader.loadPackage("LogicLib")` 才加载

---

## ❌ 如果没有生成 LogicLib.js

### 可能的原因

1. **BundleDef 未启用**
   - 检查 `src/logic/LogicLib.bundledef` 的 `"enabled": true`

2. **BuildSettings 配置错误**
   - 检查 `settings/BuildSettings.json` 的 `"enableSubpackages": true`
   - 检查 `subpackages` 数组中的 `mainScript` UUID 是否正确

3. **LayaAir IDE 缓存问题**
   - 关闭 IDE
   - 删除 `release/web/` 目录
   - 重新打开 IDE 并发布

4. **Web 平台不支持代码分包**
   - LayaAir 的代码分包（BundleDef）可能主要针对微信小游戏平台
   - 尝试发布到 `微信小游戏` 平台进行测试

---

## 🎯 下一步：微信小游戏测试

如果 Web 平台没有生成 `LogicLib.js`，建议发布到微信小游戏平台测试：

```
发布 → 微信小游戏
```

微信小游戏的输出目录：

```
release/wxgame/
├── game.js              # 主包
├── game.json            # 配置文件
└── logic/               # 分包目录
    └── LogicLib.js      # Logic 分包代码
```

---

## 📚 参考文档

- [SubpackageGuide.md](./SubpackageGuide.md) - 完整的分包实施指南
- [SubpackageTestGuide.md](./SubpackageTestGuide.md) - 分包测试指南

---

**最后更新**: 2025-12-11
**状态**: ✅ 配置完成，等待测试
