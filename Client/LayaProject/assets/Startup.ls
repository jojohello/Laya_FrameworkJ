{
  "_$ver": 1,
  "_$id": "yo1v68rt",
  "_$runtime": "res://f55d0784-7bbe-4dcc-9da3-6d7f352bec6c",
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
      "_$id": "r69o2nz8",
      "_$type": "GImage",
      "name": "img",
      "width": 750,
      "height": 1400,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "yo1v68rt"
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
      "_$id": "96izeqyk",
      "_$type": "GLabel",
      "name": "label",
      "x": 267,
      "y": 955,
      "width": 200,
      "height": 50,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "yo1v68rt"
          },
          "data": [
            6,
            0,
            13,
            0
          ]
        }
      ]
    },
    {
      "_$id": "nupsgsfb",
      "_$var": true,
      "_$type": "GTextField",
      "name": "animText",
      "x": 375,
      "y": 1070,
      "width": 164,
      "height": 54,
      "anchorX": 0.5,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "yo1v68rt"
          },
          "data": [
            6,
            0,
            13,
            0
          ]
        }
      ],
      "text": "初始化中",
      "fontSize": 40,
      "color": "#7777f1",
      "fitContent": 1,
      "bold": true,
      "align": "center"
    }
  ]
}
