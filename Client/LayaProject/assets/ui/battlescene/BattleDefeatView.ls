{
  "_$ver": 1,
  "_$id": "battle-defeat-root",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "BattleDefeatView",
  "width": 750,
  "height": 1334,
  "mouseEnabled": true,
  "_$child": [
    {
      "_$id": "battle-defeat-mask",
      "_$type": "GImage",
      "name": "background",
      "width": 750,
      "height": 1334,
      "src": "res://cc4c3978-3482-4da8-8d1e-06f61432a9de",
      "autoSize": false
    },
    {
      "_$id": "battle-defeat-art",
      "_$type": "GImage",
      "name": "defeatArt",
      "x": 185,
      "y": 45,
      "width": 380,
      "height": 380,
      "src": "res://42c88f84-2df9-49d0-a8ef-82b24472bc50",
      "autoSize": false
    },
    {
      "_$id": "battle-defeat-title",
      "_$type": "GTextField",
      "name": "titleText",
      "x": 125,
      "y": 475,
      "width": 500,
      "height": 80,
      "text": "战斗失败",
      "fontSize": 48,
      "color": "#f2a6a6",
      "bold": true,
      "align": "center",
      "valign": "middle",
      "stroke": 4,
      "strokeColor": "#591f2a"
    },
    {
      "_$id": "battle-defeat-tips",
      "_$type": "GBox",
      "name": "defeatTips",
      "x": 75,
      "y": 570,
      "width": 600,
      "height": 450,
      "_$child": [
        {
          "_$id": "battle-defeat-panel-bg",
          "_$type": "GImage",
          "name": "panelBackground",
          "width": 600,
          "height": 450,
          "src": "res://b050d62e-1085-4b1a-9d2a-c76581c1a193",
          "autoSize": false
        },
        {
          "_$id": "battle-defeat-caption",
          "_$type": "GTextField",
          "name": "defeatCaption",
          "x": 160,
          "y": 42,
          "width": 380,
          "height": 40,
          "text": "你可以通过以下方式提升实力",
          "fontSize": 22,
          "color": "#4c4c44",
          "align": "center",
          "valign": "middle"
        },
        {
          "_$id": "battle-defeat-tip-one",
          "_$type": "GBox",
          "name": "tipOne",
          "y": 100,
          "width": 600,
          "height": 95,
          "_$child": [
            {
              "_$id": "battle-defeat-tip-one-text",
              "_$type": "GTextField",
              "name": "text",
              "x": 205,
              "width": 330,
              "height": 95,
              "text": "调整阵容",
              "fontSize": 22,
              "color": "#4c4c44",
              "align": "center",
              "valign": "middle"
            }
          ]
        },
        {
          "_$id": "battle-defeat-tip-two",
          "_$type": "GBox",
          "name": "tipTwo",
          "y": 215,
          "width": 600,
          "height": 95,
          "_$child": [
            {
              "_$id": "battle-defeat-tip-two-text",
              "_$type": "GTextField",
              "name": "text",
              "x": 205,
              "width": 330,
              "height": 95,
              "text": "提高英雄等级",
              "fontSize": 22,
              "color": "#4c4c44",
              "align": "center",
              "valign": "middle"
            }
          ]
        },
        {
          "_$id": "battle-defeat-tip-three",
          "_$type": "GBox",
          "name": "tipThree",
          "y": 330,
          "width": 600,
          "height": 95,
          "_$child": [
            {
              "_$id": "battle-defeat-tip-three-text",
              "_$type": "GTextField",
              "name": "text",
              "x": 205,
              "width": 330,
              "height": 95,
              "text": "强化装备与技能",
              "fontSize": 22,
              "color": "#4c4c44",
              "align": "center",
              "valign": "middle"
            }
          ]
        }
      ]
    },
    {
      "_$id": "battle-defeat-confirm",
      "_$type": "GButton",
      "name": "confirmButton",
      "x": 375,
      "y": 1070,
      "width": 220,
      "height": 86,
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
            "_$ref": "battle-defeat-confirm",
            "_$ctrl": "button"
          },
          "propPath": "scaleX",
          "values": {
            "0": 1,
            "1": 0.92,
            "2": 1,
            "3": 0.92,
            "_$type": "Record"
          }
        },
        {
          "_$type": "GearNumber",
          "controller": {
            "_$ref": "battle-defeat-confirm",
            "_$ctrl": "button"
          },
          "propPath": "scaleY",
          "values": {
            "0": 1,
            "1": 0.92,
            "2": 1,
            "3": 0.92,
            "_$type": "Record"
          }
        }
      ],
      "_$child": [
        {
          "_$id": "battle-defeat-confirm-bg",
          "_$type": "GImage",
          "name": "background",
          "width": 220,
          "height": 86,
          "src": "res://6890b76a-c99d-41e3-8691-fa263122ff18",
          "autoSize": false
        },
        {
          "_$id": "battle-defeat-confirm-label",
          "_$type": "GTextField",
          "name": "label",
          "width": 220,
          "height": 86,
          "text": "返回征战",
          "fontSize": 24,
          "color": "#ffffff",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "stroke": 2,
          "strokeColor": "#513116"
        }
      ]
    }
  ]
}
