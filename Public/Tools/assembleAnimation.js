const fs = require('fs');
const path = require('path');

// 读取原始JSON文件
const originalData = {
    "x":0,
    "type":"View",
    "selectedBox":2,
    "searchKey":"View",
    "props":{"sceneWidth":10,"sceneHeight":10,"sceneColor":"#000000"},
    "nodeParent":-1,
    "maxID":8,
    "label":"View",
    "isOpen":null,
    "isDirectory":true,
    "isAniNode":true,
    "hasChild":true,
    "compId":2,
    "child":[
        {
            "type":"GraphicNode",
            "searchKey":"GraphicNode",
            "props":{},
            "nodeParent":2,
            "label":"GraphicNode",
            "isDirectory":false,
            "isAniNode":true,
            "hasChild":false,
            "compId":7,
            "child":[]
        }],

	"animations":[],
};


const animStr = {
	"nodes":[],
	"name":"ani1",
	"id":1,
	"frameRate":10,
	"action":0};

const nodeStr = {
	"target":7,
	"keyframes":{
	}
}

const keyframeStr = {
	"skin":[],
	"scaleX":[
		{
			"value":1,
			"tweenMethod":"linearNone",
			"tween":true,
			"target":7,
			"key":"scaleX",
			"index":0
		}],
	"pivotY":[
		{
			"value":50,
			"tweenMethod":"linearNone",
			"tween":true,
			"target":7,
			"key":"pivotY",
			"index":0
		}],
	"pivotX":[
		{
			"value":32,
			"tweenMethod":"linearNone",
			"tween":true,
			"target":7,
			"key":"pivotX",
			"index":0
		}],
};

const skinStr = {
		"value":"",
		"tweenMethod":"linearNone",
		"tween":false,
		"target":7,
		"key":"skin",
		"index":0
	};


const inputPath = process.argv[2];
const checkDir = process.argv[3];

function buildAnimJsonFile(subDirName) {
	let animInfo = {};
	let subPath = path.join(inputPath, checkDir);
	subPath = path.join(subPath, subDirName);
	let animCount = 0;
	
	const regexStr = new RegExp(`^${subDirName}_\\d+_\\d+\\.png$`);
	fs.readdirSync(subPath).forEach(file => {
		if(regexStr.test(file)) {
			let match = regexStr.exec(file);
			let integer = match[0].match(/\d+/g);
			let animNum = parseInt(integer[0]);
			
			console.log(`jojohello log math[1] = ${match[0]}, animNum = ${animNum}`);

			if(animNum in animInfo == false){
				animInfo[animNum] = 1
				animCount += 1;
			}else{
				animInfo[animNum] += 1;
			}
		}
	});

	if(Object.keys(animInfo).length == 0){
		return;
	}

	let jsonRet = JSON.parse(JSON.stringify(originalData));
	let id = 1;
	for(const key in animInfo){
		let animData = JSON.parse(JSON.stringify(animStr));
		animData.name = "ani" + key;
		animData.id = id;
		id += 1;

		let nodeData = JSON.parse(JSON.stringify(nodeStr));
		animData.nodes.push(nodeData);

		let keyframe = JSON.parse(JSON.stringify(keyframeStr));
		let frameCount = animInfo[key];
		for (let i = 0; i < frameCount; i++) {
			
			let skin = JSON.parse(JSON.stringify(skinStr));
			skin.value = `${checkDir}/${subDirName}/${subDirName}_${key}_${i}.png`;
			skin.index = i;

			keyframe.skin.push(skin);
			
		}

		nodeData.keyframes = keyframe;

		jsonRet.animations.push(animData);
	}

	const newData = JSON.stringify(jsonRet, null, 4);
	let targetPath = path.join(inputPath, checkDir);
	targetPath = path.join(targetPath, subDirName + ".ani");
	fs.writeFileSync(targetPath, newData);

	console.log(`JSON内容已成功修改并保存到 ${targetPath} 文件中。`);
}

fs.stat(path.join(inputPath, checkDir), (err, stats) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

	if (stats.isDirectory() == false) {
		console.log('Input path is not a directory.');
        process.exit(1);
	}

	fs.readdir(path.join(inputPath, checkDir), (err, dir) => {
		if (err) {
			console.error(err);
			process.exit(1);
		}

		dir.forEach((dirName) => {
			let newPath = path.join(inputPath, checkDir);
			newPath = path.join(newPath, dirName);
			fs.stat(newPath, (err, stats) => {
				if(stats.isDirectory()){
					buildAnimJsonFile(dirName);
				}
			});
		});
	});
});


// // 根据要求修改JSON内容
// jsonData.animations.forEach(animation => {
//     animation.nodes.forEach(node => {
//         node.keyframes.skin.forEach((frame, index) => {
//             frame.value = `models/jipuche/jipuche_${index}_0.png`;
//         });
//     });
// });

// // 将修改后的JSON内容写入新文件
// const newData = JSON.stringify(jsonData, null, 4);
// fs.writeFileSync('modified.json', newData);

// console.log('JSON内容已成功修改并保存到modified.json文件中。');