{
  "_$ver": 1,
  "_$id": "battle-main-view",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "BattleMainView",
  "width": 750,
  "height": 1334,
  "mouseThrough": true,
  "_$child": [
    {
      "_$id": "battle-pause-overlay",
      "_$type": "GBox",
      "name": "pauseOverlay",
      "width": 750,
      "height": 1334,
      "visible": false,
      "mouseEnabled": false,
      "_$child": [
        {
          "_$id": "battle-paused-label",
          "_$type": "GTextField",
          "name": "pausedLabel",
          "x": 250,
          "y": 590,
          "width": 250,
          "height": 70,
          "text": "战斗暂停",
          "fontSize": 38,
          "color": "#fff3d9",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "stroke": 4,
          "strokeColor": "#172a35"
        }
      ]
    },
    {
      "_$id": "battle-toolbar",
      "_$type": "GBox",
      "name": "toolbar",
      "x": 534,
      "y": 22,
      "width": 196,
      "height": 108,
      "mouseThrough": true,
      "_$child": [
        {
          "_$id": "battle-pause-button",
          "_$type": "GLoader",
          "name": "pauseButton",
          "width": 96,
          "height": 108,
          "src": "res://cf08cdc3-7581-489d-afdf-b7abf50e6066",
          "mouseEnabled": true
        },
        {
          "_$id": "battle-back-button",
          "_$type": "GLoader",
          "name": "backButton",
          "x": 100,
          "width": 96,
          "height": 108,
          "src": "res://1ae6de2d-7b7d-40ca-aa18-bdeaf23f7789",
          "mouseEnabled": true
        }
      ]
    }
  ]
}
