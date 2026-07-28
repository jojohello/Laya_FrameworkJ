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
  "_$child": [
    {
      "_$id": "battle-victory-bg",
      "_$type": "GImage",
      "name": "bg",
      "x": -20,
      "y": -25,
      "width": 779,
      "height": 1386,
      "alpha": 0.84,
      "_mouseState": 2,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-victory-root"
          },
          "data": [
            1,
            0,
            2,
            0
          ]
        }
      ],
      "src": "res://43f87ea2-ca0d-4322-a165-4abb7bc183f6",
      "autoSize": false
    },
    {
      "_$id": "battle-victory-art",
      "_$type": "GImage",
      "name": "victoryArt",
      "x": 185,
      "y": 100,
      "width": 380,
      "height": 253,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-victory-root"
          },
          "data": [
            6,
            0,
            13,
            0
          ]
        }
      ],
      "src": "res://bed03bfb-1c8d-481f-915f-ac13adb74a76",
      "autoSize": false
    },
    {
      "_$id": "battle-victory-title-bg",
      "_$type": "GImage",
      "name": "titleBackground",
      "x": 145,
      "y": 370,
      "width": 460,
      "height": 82,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-victory-root"
          },
          "data": [
            6,
            0,
            13,
            0
          ]
        }
      ],
      "src": "res://cf489899-66ec-4629-ac3b-1b35ba20e78f",
      "autoSize": false
    },
    {
      "_$id": "battle-victory-title",
      "_$type": "GTextField",
      "name": "titleText",
      "x": 145,
      "y": 380,
      "width": 460,
      "height": 60,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-victory-root"
          },
          "data": [
            6,
            0,
            13,
            0
          ]
        }
      ],
      "text": "战斗胜利",
      "fontSize": 44,
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
      "y": 455,
      "width": 400,
      "height": 54,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-victory-root"
          },
          "data": [
            6,
            0,
            13,
            0
          ]
        }
      ],
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
      "x": 95,
      "y": 530,
      "width": 560,
      "height": 235,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-victory-root"
          },
          "data": [
            6,
            0,
            13,
            0
          ]
        }
      ],
      "_$child": [
        {
          "_$id": "battle-victory-panel-bg",
          "_$type": "GImage",
          "name": "panelBackground",
          "width": 560,
          "height": 235,
          "src": "res://f4603d4f-ae2b-4e5d-8690-d0c0a1811e48",
          "autoSize": false
        },
        {
          "_$id": "battle-victory-reward-title",
          "_$type": "GTextField",
          "name": "rewardTitle",
          "x": 90,
          "y": 22,
          "width": 380,
          "height": 40,
          "text": "战斗奖励",
          "fontSize": 30,
          "color": "#ffe6a8",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "stroke": 3,
          "strokeColor": "#4c4c44"
        },
        {
          "_$id": "battle-victory-reward-surface",
          "_$type": "GImage",
          "name": "rewardSurface",
          "x": 28,
          "y": 62,
          "width": 504,
          "height": 158,
          "alpha": 0.78,
          "src": "res://43f87ea2-ca0d-4322-a165-4abb7bc183f6",
          "autoSize": false
        },
        {
          "_$id": "battle-victory-reward-list",
          "_$type": "GList",
          "name": "rewardList",
          "x": 42,
          "y": 72,
          "width": 476,
          "height": 138,
          "_mouseState": 2,
          "clipping": true,
          "scroller": {
            "_$type": "Scroller",
            "direction": 1,
            "barDisplay": 5,
            "touchEffect": 1,
            "bouncebackEffect": 1
          },
          "layout": {
            "type": 2,
            "columnGap": 18,
            "align": 1
          },
          "_templateNode": {
            "_$ref": "battle-victory-reward-item",
            "_$tmpl": "itemTemplate"
          },
          "_initItemNum": null,
          "_$child": [
            {
              "_$id": "battle-victory-reward-item",
              "_$type": "GBox",
              "name": "rewardItem",
              "width": 112,
              "height": 150,
              "_$child": [
                {
                  "_$id": "battle-victory-reward-item-container",
                  "_$type": "GBox",
                  "name": "itemContainer",
                  "width": 112,
                  "height": 112
                },
                {
                  "_$id": "battle-victory-reward-item-name",
                  "_$type": "GTextField",
                  "name": "rewardName",
                  "y": 112,
                  "width": 112,
                  "height": 34,
                  "text": "中级精石",
                  "fontSize": 20,
                  "color": "#4c4c44",
                  "align": "center",
                  "valign": "middle"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "_$id": "battle-victory-confirm",
      "_$type": "GButton",
      "name": "confirmButton",
      "x": 375,
      "y": 845,
      "width": 260,
      "height": 92,
      "anchorX": 0.5,
      "anchorY": 0.5,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-victory-root"
          },
          "data": [
            6,
            0,
            13,
            0
          ]
        }
      ],
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
          "width": 260,
          "height": 92,
          "src": "res://6890b76a-c99d-41e3-8691-fa263122ff18",
          "autoSize": false
        },
        {
          "_$id": "battle-victory-confirm-label",
          "_$type": "GTextField",
          "name": "label",
          "width": 260,
          "height": 92,
          "text": "领取奖励",
          "fontSize": 26,
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
