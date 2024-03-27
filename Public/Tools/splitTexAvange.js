// 将图集平均切分成n*m个小图

// import sharp from 'sharp';
// import { argv } from 'yargs';
const fs = require('fs');
const path = require('path');
const sharp = require('./node-v20.11.0-win-x64/node_modules/sharp');
const argv = require('./node-v20.11.0-win-x64/node_modules/yargs').argv;


// 从命令行参数中获取输入文件路径、输出路径、n和m
const inputFile = process.argv[2];
const n = parseInt(process.argv[3]);
const m = parseInt(process.argv[4]);
const outputDir = process.argv[5];

console.log('inputFile:', inputFile);
console.log('n:', n);
console.log('m:', m);
console.log('outputDir:', outputDir)

if (!inputFile || !outputDir || !n || !m) {
    console.log('Usage: node splitImage.js <inputFile> <outputDir> <n> <m>');
    process.exit(1);
}

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function splitImage(inputFile, n, m, outputDir) {
    const fileName = path.basename(inputFile).replace('.png', '');
    sharp(inputFile)
        .metadata()
        .then(metadata => {
            const width = metadata.width;
            const height = metadata.height;
            const cellWidth = Math.floor(width / n);
            const cellHeight = Math.floor(height / m);

            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    sharp(inputFile)
                        .extract({
                            left: i * cellWidth,
                            top: j * cellHeight,
                            width: cellWidth,
                            height: cellHeight
                        })
                        .toFile(path.join(outputDir, `${fileName}_${j}_${i}.png`))
                        .then(() => console.log(`Created ${fileName}_${j}_${i}.png`))
                        .catch(err => console.error(err));
                }
            }
        })
        .catch(err => console.error(err));
}

fs.stat(inputFile, (err, stats) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    if (stats.isDirectory()) {
        fs.readdir(inputFile, (err, files) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }

            files.forEach(file => {
                 const filePath = path.join(inputFile, file);
                if (fs.statSync(filePath).isFile() && filePath.endsWith('.png')) {
                    const fileName = path.parse(file).name;
                    const outputSubDir = path.join(outputDir, fileName);
                    if (!fs.existsSync(outputSubDir)) {
                        fs.mkdirSync(outputSubDir);
                    }
                    splitImage(filePath, n, m, outputSubDir);
                }
            });
        });
    } else if (stats.isFile() && inputFile.endsWith('.png')) {
        const fileName = path.parse(inputFile).name;
        const outputSubDir = path.join(outputDir, fileName);
        if (!fs.existsSync(outputSubDir)) {
            fs.mkdirSync(outputSubDir);
        }
        splitImage(inputFile, n, m, outputSubDir);
    } else {
        console.log('Input path is neither a file nor a directory.');
        process.exit(1);
    }
});