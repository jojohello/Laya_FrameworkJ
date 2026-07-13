{
  "_$ver": 1,
  "_$id": "f66zmp2u",
  "_$runtime": "res://49b4831a-0f49-4a32-a8bd-d6e7c69250b0",
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
      "name": "img",
      "width": 750,
      "height": 1440,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "f66zmp2u"
          },
          "data": [
            1,
            0,
            13,
            0
          ]
        }
      ],
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
      "_$id": "nop5lnei",
      "_$type": "GImage",
      "name": "process-bg",
      "x": 375,
      "y": 1034,
      "width": 466,
      "height": 36,
      "anchorX": 0.5,
      "src": "res://172f3217-8db1-4c53-8b05-344a3b1bed67",
      "autoSize": false,
      "color": "#b4cff9",
      "_$child": [
        {
          "_$id": "ootvmtwi",
          "_$type": "GImage",
          "name": "img_1",
          "x": 2,
          "y": 2,
          "width": 100,
          "height": 34,
          "scaleX": 4.6,
          "relations": [
            {
              "_$type": "Relation",
              "target": {
                "_$ref": "f66zmp2u"
              },
              "data": []
            }
          ],
          "src": "res://877ddc7c-8a3b-4b1a-be64-74a01880c40e",
          "autoSize": false
        },
        {
          "_$id": "slsan4r1",
          "_$var": true,
          "_$type": "GTextField",
          "name": "context",
          "x": 233,
          "y": 5,
          "width": 183,
          "height": 29,
          "anchorX": 0.5,
          "text": "当前加载内容 100%",
          "font": "res://562d5d5c-585b-4379-9a0f-65091e0d0d4e",
          "fontSize": 20,
          "color": "#d8e2fa",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "stroke": 1
        }
      ]
    },
    {
      "_$id": "85e675yi",
      "_$var": true,
      "_$type": "GProgressBar",
      "name": "process-bar",
      "x": 333,
      "y": 810,
      "width": 100,
      "height": 119,
      "value": 151,
      "_hBar": {
        "_$ref": "ootvmtwi"
      }
    }
  ]
}
