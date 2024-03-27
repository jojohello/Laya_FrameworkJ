注意：
1、如果要使用npm安装第三方，第一次一定要先重新安装一下npm，否则可能因为路径发生变化，npm的依赖路径不对，造成npm被删除
2、安装npm的方法为，在cmd窗口，将目录cd到nodejs的解压目录下，比如当前当前的nodejs目录为node-v20.11.1-win-x64，运行指令npm install npm 即可

当前框架已包含的第三方库：
------------------------------------------------------------
-- 使用rollup，将ts文件编译成js库
1、npm install rollup
2、npm install rollup-plugin-typescript2
3、npm install @rollup/plugin-node-resolve
4、npm install typescript
-----------------------------------------------------------
-- 使用sharp切分png文件，yargs用于读取命令行参数
5、npm install sharp yargs
6、npm install @types/sharp @types/yargs