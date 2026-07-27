{
  "_$ver": 1,
  "_$id": "battle-victory-root",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "BattleVictoryView",
  "width": 750,
  "height": 1334,
  "mouseEnabled": true,
  "_$child": [
    {
      "_$id": "battle-victory-mask",
      "_$type": "GBox",
      "name": "modalMask",
      "width": 750,
      "height": 1334,
      "mouseEnabled": true
    },
    {
      "_$id": "battle-victory-art",
      "_$type": "GImage",
      "name": "victoryArt",
      "x": 50,
      "y": 70,
      "width": 650,
      "height": 434,
      "src": "res://bed03bfb-1c8d-481f-915f-ac13adb74a76",
      "autoSize": false
    },
    {
      "_$id": "battle-victory-title",
      "_$type": "GTextField",
      "name": "titleText",
      "x": 75,
      "y": 500,
      "width": 600,
      "height": 80,
      "text": "战斗胜利",
      "fontSize": 48,
      "color": "#ffe6a8",
      "bold": true,
      "align": "center",
      "valign": "middle",
      "stroke": 4,
      "strokeColor": "#6a3e12"
    },
    {
      "_$id": "battle-victory-score",
      "_$type": "GTextField",
      "name": "scoreText",
      "x": 175,
      "y": 605,
      "width": 400,
      "height": 54,
      "text": "战斗评分：345",
      "fontSize": 27,
      "color": "#fff3d9",
      "bold": true,
      "align": "center",
      "valign": "middle",
      "stroke": 3,
      "strokeColor": "#234955"
    },
    {
      "_$id": "battle-victory-reward-panel",
      "_$type": "GBox",
      "name": "rewardPanel",
      "x": 115,
      "y": 690,
      "width": 520,
      "height": 260,
      "_$child": [
        {
          "_$id": "battle-victory-panel-bg",
          "_$type": "GImage",
          "name": "panelBackground",
          "width": 520,
          "height": 260,
          "src": "res://426d8b25-ac2e-4152-b43e-4029a9aa8f00",
          "autoSize": false
        },
        {
          "_$id": "battle-victory-reward-title",
          "_$type": "GTextField",
          "name": "rewardTitle",
          "x": 90,
          "y": 18,
          "width": 340,
          "height": 44,
          "text": "战斗奖励",
          "fontSize": 36,
          "color": "#ffe6a8",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "stroke": 3,
          "strokeColor": "#4c4c44"
        },
        {
          "_$id": "battle-victory-item-container",
          "_$type": "GBox",
          "name": "itemContainer",
          "x": 204,
          "y": 78,
          "width": 112,
          "height": 112
        },
        {
          "_$id": "battle-victory-reward-name",
          "_$type": "GTextField",
          "name": "rewardName",
          "x": 80,
          "y": 198,
          "width": 360,
          "height": 36,
          "text": "中级精石",
          "fontSize": 22,
          "color": "#4c4c44",
          "align": "center",
          "valign": "middle"
        }
      ]
    },
    {
      "_$id": "battle-victory-confirm",
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
            "_$ref": "battle-victory-confirm",
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
            "_$ref": "battle-victory-confirm",
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
          "_$id": "battle-victory-confirm-bg",
          "_$type": "GImage",
          "name": "background",
          "width": 220,
          "height": 86,
          "src": "res://6890b76a-c99d-41e3-8691-fa263122ff18",
          "autoSize": false
        },
        {
          "_$id": "battle-victory-confirm-label",
          "_$type": "GTextField",
          "name": "label",
          "width": 220,
          "height": 86,
          "text": "领取并返回",
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
