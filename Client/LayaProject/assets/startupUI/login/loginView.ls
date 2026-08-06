{
  "_$ver": 1,
  "_$id": "f66zmp2u",
  "_$runtime": "res://d36aceb7-22e0-486a-a492-82de8b740958",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "Scene2D",
  "width": 750,
  "height": 1334,
  "_$child": [
    {
      "_$id": "vmn78x8i",
      "_$type": "GImage",
      "name": "fullBleedBackground",
      "width": 750,
      "height": 1440,
      "src": "res://1f4b2188-00b3-4f1c-af3b-ad8e7564353f",
      "autoSize": false,
      "_$comp": [
        {
          "_$type": "99757105-35e7-4332-9bd0-826a64a1f443",
          "scriptPath": "../src/script/LockRatio.ts"
        }
      ]
    },
    {
      "_$id": "login-safe-area-root",
      "_$type": "GBox",
      "name": "safeAreaRoot",
      "width": 750,
      "height": 1334,
      "mouseThrough": true,
      "touchable": false
    },
    {
      "_$id": "pmmj2h97",
      "_$var": true,
      "_$type": "GBox",
      "name": "loginPanel",
      "x": 96,
      "y": 925,
      "width": 564,
      "height": 300,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "login-safe-area-root"
          },
          "data": [
            6,
            0,
            16,
            0
          ]
        }
      ],
      "layout": {
        "valign": 2
      },
      "_$child": [
        {
          "_$id": "lcevcff2",
          "_$type": "GImage",
          "name": "img",
          "x": 112,
          "y": 3,
          "width": 339,
          "height": 64,
          "relations": [
            {
              "_$type": "Relation",
              "target": {
                "_$ref": "pmmj2h97"
              },
              "data": [
                6,
                0,
                13,
                0
              ]
            }
          ],
          "src": "res://f22fe50f-cd7b-46e9-9098-8eb3473ac9c1",
          "autoSize": false
        },
        {
          "_$id": "9faaeorl",
          "_$var": true,
          "_$type": "GTextInput",
          "name": "input",
          "x": 123,
          "y": 11,
          "width": 312,
          "height": 49,
          "relations": [
            {
              "_$type": "Relation",
              "target": {
                "_$ref": "pmmj2h97"
              },
              "data": [
                6,
                0,
                13,
                0
              ]
            }
          ],
          "text": "",
          "fontSize": 32,
          "color": "#2e2e5d",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "maxChars": 24,
          "prompt": "请输入账号",
          "promptColor": "#797996"
        },
        {
          "_$id": "jjzuuver",
          "_$var": true,
          "_$type": "GImage",
          "name": "confirmBtn",
          "x": 170,
          "y": 122,
          "width": 221,
          "height": 71,
          "relations": [
            {
              "_$type": "Relation",
              "target": {
                "_$ref": "pmmj2h97"
              },
              "data": []
            }
          ],
          "src": "res://a68dcef8-c493-4ee5-bd87-fb1a6f799351",
          "autoSize": false,
          "_$child": [
            {
              "_$id": "1qdziis0",
              "_$type": "GTextField",
              "name": "txt",
              "x": 68,
              "y": 20,
              "width": 87,
              "height": 42,
              "text": "登  录",
              "fontSize": 32,
              "color": "#292980",
              "fitContent": 1,
              "bold": true,
              "align": "center",
              "valign": "middle"
            }
          ]
        }
      ]
    },
    {
      "_$id": "login-auto-progress-panel",
      "_$type": "GBox",
      "name": "autoLoginPanel",
      "x": 92,
      "y": 1015,
      "width": 566,
      "height": 110,
      "visible": false,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "login-safe-area-root"
          },
          "data": [
            6,
            0,
            16,
            0
          ]
        }
      ],
      "_$child": [
        {
          "_$id": "login-auto-progress-status",
          "_$type": "GTextField",
          "name": "autoLoginStatus",
          "x": 0,
          "y": 0,
          "width": 566,
          "height": 42,
          "text": "正在登录…",
          "font": "res://562d5d5c-585b-4379-9a0f-65091e0d0d4e",
          "fontSize": 24,
          "color": "#fff4cf",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "stroke": 2,
          "strokeColor": "#29233f"
        },
        {
          "_$id": "login-auto-progress-bg",
          "_$type": "GImage",
          "name": "autoLoginProgressBg",
          "x": 50,
          "y": 52,
          "width": 466,
          "height": 36,
          "src": "res://172f3217-8db1-4c53-8b05-344a3b1bed67",
          "autoSize": false,
          "color": "#b4cff9"
        },
        {
          "_$id": "login-auto-progress-fill",
          "_$type": "GImage",
          "name": "autoLoginProgressFill",
          "x": 52,
          "y": 54,
          "width": 37,
          "height": 34,
          "src": "res://877ddc7c-8a3b-4b1a-be64-74a01880c40e",
          "autoSize": false
        }
      ]
    }
  ]
}
