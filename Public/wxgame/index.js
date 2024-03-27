"use strict";"undefined"!=typeof swan&&"undefined"!=typeof swanGlobal?(require("swan-game-adapter.js"),require("libs/laya.bdmini.js")):"undefined"!=typeof wx&&(require("weapp-adapter.js"),require("libs/min/laya.wxmini.min.js")),window.loadLib=require,/**
 * 设置LayaNative屏幕方向，可设置以下值
 * landscape           横屏
 * portrait            竖屏
 * sensor_landscape    横屏(双方向)
 * sensor_portrait     竖屏(双方向)
 */
window.screenOrientation = "portrait";

//-----设置运行参数----
var params = window.params = {};
params.cdnURL = "http://127.0.0.1:8888/";

//-----libs-begin-----
loadLib("libs/min/laya.core.min.js")
loadLib("libs/min/laya.html.min.js")
loadLib("libs/min/laya.tiledmap.min.js")
loadLib("libs/min/laya.ui.min.js")
loadLib("libs/min/bytebuffer.min.js")
//loadLib("libs/min/worker.min.js")
//loadLib("libs/min/workerloader.min.js")
//-----libs-end-------
window.JSZip = loadLib("libs/min/jszip.min.js");
//loadLib("libs/fairygui/rawinflate.min.js");
loadLib("libs/fairygui/fairygui.js");
loadLib("js/extension.js");
loadLib("js/bundle.js");