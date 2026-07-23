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
      "x": 502,
      "y": 14,
      "width": 232,
      "height": 81,
      "mouseThrough": true,
      "_$child": [
        {
          "_$id": "battle-speed-button",
          "_$type": "GButton",
          "name": "speedButton",
          "x": 36,
          "y": 40.5,
          "width": 72,
          "height": 81,
          "anchorX": 0.5,
          "anchorY": 0.5,
          "controllers": {
            "_$type": "Record",
            "button": {
              "_$type": "Controller",
              "pages": [
                "up",
                "down",
                "over",
                "selectedOver"
              ]
            }
          },
          "gears": [
            {
              "_$type": "GearNumber",
              "controller": {
                "_$ref": "battle-speed-button",
                "_$ctrl": "button"
              },
              "propPath": "scaleX",
              "values": {
                "0": 1,
                "1": 0.9,
                "2": 1,
                "3": 0.9,
                "_$type": "Record"
              }
            },
            {
              "_$type": "GearNumber",
              "controller": {
                "_$ref": "battle-speed-button",
                "_$ctrl": "button"
              },
              "propPath": "scaleY",
              "values": {
                "0": 1,
                "1": 0.9,
                "2": 1,
                "3": 0.9,
                "_$type": "Record"
              }
            }
          ],
          "_$child": [
            {
              "_$id": "battle-speed-background",
              "_$type": "GImage",
              "name": "background",
              "width": 72,
              "height": 81,
              "src": "res://3b6045fd-fdd9-4783-bd8e-5ab994a6e4ac",
              "autoSize": false
            },
            {
              "_$id": "battle-speed-label",
              "_$type": "GTextField",
              "name": "speedLabel",
              "width": 72,
              "height": 81,
              "text": "1×",
              "fontSize": 27,
              "color": "#fff3d9",
              "bold": true,
              "align": "center",
              "valign": "middle",
              "stroke": 3,
              "strokeColor": "#234955"
            }
          ]
        },
        {
          "_$id": "battle-pause-button",
          "_$type": "GButton",
          "name": "pauseButton",
          "x": 116,
          "y": 40.5,
          "width": 72,
          "height": 81,
          "anchorX": 0.5,
          "anchorY": 0.5,
          "controllers": {
            "_$type": "Record",
            "button": {
              "_$type": "Controller",
              "pages": [
                "up",
                "down",
                "over",
                "selectedOver"
              ]
            }
          },
          "gears": [
            {
              "_$type": "GearNumber",
              "controller": {
                "_$ref": "battle-pause-button",
                "_$ctrl": "button"
              },
              "propPath": "scaleX",
              "values": {
                "0": 1,
                "1": 0.9,
                "2": 1,
                "3": 0.9,
                "_$type": "Record"
              }
            },
            {
              "_$type": "GearNumber",
              "controller": {
                "_$ref": "battle-pause-button",
                "_$ctrl": "button"
              },
              "propPath": "scaleY",
              "values": {
                "0": 1,
                "1": 0.9,
                "2": 1,
                "3": 0.9,
                "_$type": "Record"
              }
            }
          ],
          "_$child": [
            {
              "_$id": "battle-pause-image",
              "_$type": "GImage",
              "name": "image",
              "width": 72,
              "height": 81,
              "src": "res://cf08cdc3-7581-489d-afdf-b7abf50e6066",
              "autoSize": false
            }
          ]
        },
        {
          "_$id": "battle-back-button",
          "_$type": "GButton",
          "name": "backButton",
          "x": 196,
          "y": 40.5,
          "width": 72,
          "height": 81,
          "anchorX": 0.5,
          "anchorY": 0.5,
          "controllers": {
            "_$type": "Record",
            "button": {
              "_$type": "Controller",
              "pages": [
                "up",
                "down",
                "over",
                "selectedOver"
              ]
            }
          },
          "gears": [
            {
              "_$type": "GearNumber",
              "controller": {
                "_$ref": "battle-back-button",
                "_$ctrl": "button"
              },
              "propPath": "scaleX",
              "values": {
                "0": 1,
                "1": 0.9,
                "2": 1,
                "3": 0.9,
                "_$type": "Record"
              }
            },
            {
              "_$type": "GearNumber",
              "controller": {
                "_$ref": "battle-back-button",
                "_$ctrl": "button"
              },
              "propPath": "scaleY",
              "values": {
                "0": 1,
                "1": 0.9,
                "2": 1,
                "3": 0.9,
                "_$type": "Record"
              }
            }
          ],
          "_$child": [
            {
              "_$id": "battle-back-image",
              "_$type": "GImage",
              "name": "image",
              "width": 72,
              "height": 81,
              "src": "res://1ae6de2d-7b7d-40ca-aa18-bdeaf23f7789",
              "autoSize": false
            }
          ]
        }
      ]
    }
  ]
}
