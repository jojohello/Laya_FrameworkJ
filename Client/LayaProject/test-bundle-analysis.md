# 分包机制分析

## 当前配置

### BuildSettings.json
- `enableSubpackages`: true
- 分包路径: `../src/logic`
- `autoLoad`: true

### LogicLib.bundledef
- `bundleExternals`: false  ← 关键配置！

## 问题：common 代码会被重复打包吗？

### 场景分析

```
src/
├── common/
│   └── MessageIds.ts          # 被两个包导入
│
├── start/                      # 主包
│   └── login/
│       └── LoginProtocol.ts   # import from "../../common/MessageIds"
│
└── logic/                      # 分包
    └── xxx/
        └── XxxProtocol.ts     # import from "../../common/MessageIds"
```

### 情况 1: bundleExternals = false (当前配置)

**结果**: ✅ **会重复打包**

- 主包: 包含 `start/**` + `common/MessageIds.ts`
- 分包: 包含 `logic/**` + `common/MessageIds.ts`
- **MessageIds.ts 被打包了 2 次**

**原因**: 
- `bundleExternals: false` 表示不外部化依赖
- 每个包都会把自己的依赖打包进去
- common 被两个包依赖，所以被打包 2 次

### 情况 2: bundleExternals = true

**结果**: ✅ **不会重复打包**

- 主包: 包含 `start/**` + `common/MessageIds.ts`
- 分包: 只包含 `logic/**`，依赖主包的 MessageIds

**原因**:
- `bundleExternals: true` 表示外部化依赖
- 分包会引用主包已经加载的模块
- common 只在主包中打包 1 次

## 验证方法

构建项目后检查打包文件大小：

```bash
# 查看主包大小
ls -lh bin/js/bundle.js

# 查看分包大小  
ls -lh bin/js/logic/bundle.js

# 搜索 MessageIds 在文件中出现次数
grep -o "LOGIN_SUCCESS" bin/js/bundle.js | wc -l
grep -o "LOGIN_SUCCESS" bin/js/logic/bundle.js | wc -l
```

如果两个文件都包含 LOGIN_SUCCESS，说明重复打包了。

## 结论

**当前配置 (bundleExternals: false)**: 
- ❌ **会重复打包** common 代码
- ❌ 增加总包体积
- ✅ 但每个包完全独立，可以单独运行

**建议配置 (bundleExternals: true)**:
- ✅ **不会重复打包**
- ✅ 减少总包体积
- ⚠️ 分包依赖主包，必须先加载主包
