console.log("jojohello start compile js curDir = " + __dirname);

// import rollup from "rollup";
// import typescript from "rollup-plugin-typescript2";
// import resolve from "@rollup/plugin-node-resolve";
const rollup = require("../../Public/Tools/node-v20.11.0-win-x64/node_modules/rollup");
const typescript = require("../../Public/Tools/node-v20.11.0-win-x64/node_modules/rollup-plugin-typescript2");
const resolve = require("../../Public/Tools/node-v20.11.0-win-x64/node_modules/@rollup/plugin-node-resolve").nodeResolve;

const fs = require("fs");

const delFolderOptions = {
	recursive: true, // 递归删除文件夹中的内容
	force:true,		// 强制删除,即使路径不存在也不会报错
}

rollup.rollup({
	input: './src/Main.ts',
	treeshake: true,
	plugins: [
		typescript({
			check: false,
			tsconfigOverride:{compilerOptions:{removeComments: true}}
		}),
		// glsl({
		// 	include: /.*(.glsl|.vs|.fs)$/,
		// 	sourceMap: false,
		// 	compress:false
		// }),
		resolve(),
	]
}).then(bundle => {
	return bundle.write({
		file: './bin/js/bundle.js',
		format: 'iife',
		name: 'bundle',
		sourcemap: false
	});
}).then((value)=>{
	// 删除编译多出来的文件夹
	let errorFun = (error) => {//function(error) {
		if (error)	{
			console.error('Error while deleting the folder: ${error.message}');
		} else {
			console.log('Folder deleted successfully');
		}

	}

	fs.rm("./node_modules", delFolderOptions, errorFun);
	fs.rm("./.rpt2_cache", delFolderOptions, errorFun);

	console.log('编译完成');
	// var gamePath = path.resolve(__dirname, `./../bin/js/PackageLoading.js`);
	// console.log("输出路径：" + gamePath);
	// var source = gamePath;
	// var dest = path.resolve(__dirname, `../../../website/js/PackageLoading.js`);
	// copyFile(source, dest);
	// console.log('deleteall cache');
	// deleteall('./undefined');
})


