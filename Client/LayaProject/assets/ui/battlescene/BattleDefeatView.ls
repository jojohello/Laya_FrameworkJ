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
  "_$child": [
    {
      "_$id": "0gfwvrjg",
      "_$type": "GImage",
      "name": "bg",
      "x": -20,
      "y": -25,
      "width": 779,
      "height": 1386,
      "alpha": 0.88,
      "_mouseState": 2,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-defeat-root"
          },
          "data": [
            1,
            0,
            2,
            0
          ]
        }
      ],
      "src": "res://0a7c3be5-1c66-4281-be69-20cb3b133418",
      "autoSize": false
    },
    {
      "_$id": "battle-defeat-art",
      "_$type": "GImage",
      "name": "defeatArt",
      "x": 210,
      "y": 100,
      "width": 330,
      "height": 330,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-defeat-root"
          },
          "data": [
            6,
            0,
            13,
            0
          ]
        }
      ],
      "src": "res://42c88f84-2df9-49d0-a8ef-82b24472bc50",
      "autoSize": false
    },
    {
      "_$id": "battle-defeat-title-bg",
      "_$type": "GImage",
      "name": "titleBackground",
      "x": 145,
      "y": 440,
      "width": 460,
      "height": 82,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-defeat-root"
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
      "_$id": "battle-defeat-title",
      "_$type": "GTextField",
      "name": "titleText",
      "x": 145,
      "y": 450,
      "width": 460,
      "height": 60,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-defeat-root"
          },
          "data": [
            6,
            0,
            13,
            0
          ]
        }
      ],
      "text": "战斗失败",
      "fontSize": 44,
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
      "x": 95,
      "y": 555,
      "width": 560,
      "height": 315,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-defeat-root"
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
          "_$id": "battle-defeat-panel-bg",
          "_$type": "GImage",
          "name": "panelBackground",
          "width": 560,
          "height": 315,
          "src": "res://f4603d4f-ae2b-4e5d-8690-d0c0a1811e48",
          "autoSize": false
        },
        {
          "_$id": "battle-defeat-caption",
          "_$type": "GTextField",
          "name": "defeatCaption",
          "x": 70,
          "y": 18,
          "width": 420,
          "height": 44,
          "text": "提升战力建议",
          "fontSize": 26,
          "color": "#4c4c44",
          "bold": true,
          "align": "center",
          "valign": "middle"
        },
        {
          "_$id": "battle-defeat-suggestion-surface",
          "_$type": "GImage",
          "name": "suggestionSurface",
          "x": 33,
          "y": 72,
          "width": 494,
          "height": 214,
          "alpha": 0.78,
          "src": "res://43f87ea2-ca0d-4322-a165-4abb7bc183f6",
          "autoSize": false
        },
        {
          "_$id": "battle-defeat-suggestion-list",
          "_$type": "GList",
          "name": "suggestionList",
          "x": 44,
          "y": 88,
          "width": 472,
          "height": 182,
          "_mouseState": 2,
          "clipping": true,
          "scroller": {
            "_$type": "Scroller",
            "direction": 0,
            "barDisplay": 5,
            "touchEffect": 1,
            "bouncebackEffect": 1
          },
          "layout": {
            "type": 1,
            "rowGap": 6,
            "align": 1
          },
          "_templateNode": {
            "_$ref": "battle-defeat-suggestion-item",
            "_$tmpl": "itemTemplate"
          },
          "_initItemNum": 5,
          "_isDemo": true,
          "_$child": [
            {
              "_$id": "battle-defeat-suggestion-item",
              "_$type": "GBox",
              "name": "suggestionItem",
              "width": 472,
              "height": 50,
              "_$child": [
                {
                  "_$id": "battle-defeat-suggestion-text",
                  "_$type": "GTextField",
                  "name": "text",
                  "width": 472,
                  "height": 50,
                  "text": "调整阵容与站位",
                  "fontSize": 28,
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
      "_$id": "battle-defeat-confirm",
      "_$type": "GButton",
      "name": "confirmButton",
      "x": 375,
      "y": 950,
      "width": 260,
      "height": 92,
      "anchorX": 0.5,
      "anchorY": 0.5,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "battle-defeat-root"
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
          "width": 260,
          "height": 92,
          "src": "res://6890b76a-c99d-41e3-8691-fa263122ff18",
          "autoSize": false
        },
        {
          "_$id": "battle-defeat-confirm-label",
          "_$type": "GTextField",
          "name": "label",
          "width": 260,
          "height": 92,
          "text": "返回征战",
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
