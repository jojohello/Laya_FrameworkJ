{
  "_$ver": 1,
  "_$id": "bag-ui-root",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "BagUI",
  "width": 750,
  "height": 1334,
  "_$child": [
    {
      "_$id": "bag-page-backdrop",
      "_$type": "GImage",
      "name": "fullBleedBackdrop",
      "x": -7,
      "y": -22,
      "width": 776,
      "height": 1411,
      "alpha": 0.98,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "bag-ui-root"
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
      "_$id": "bag-safe-area-root",
      "_$type": "GBox",
      "name": "safeAreaRoot",
      "width": 750,
      "height": 1334,
      "mouseThrough": true,
      "touchable": false
    },
    {
      "_$id": "bag-panel",
      "_$type": "GImage",
      "name": "panelBackground",
      "x": 3,
      "y": 126,
      "width": 745,
      "height": 964,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "bag-safe-area-root" },
          "data": [10, 0, 24, 0]
        }
      ],
      "src": "res://f4603d4f-ae2b-4e5d-8690-d0c0a1811e48",
      "autoSize": false
    },
    {
      "_$id": "bag-title-bg",
      "_$type": "GImage",
      "name": "titleBackground",
      "x": 145,
      "y": 136,
      "width": 460,
      "height": 82,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "bag-safe-area-root" },
          "data": [6, 0, 10, 0]
        }
      ],
      "src": "res://cf489899-66ec-4629-ac3b-1b35ba20e78f",
      "autoSize": false
    },
    {
      "_$id": "bag-title",
      "_$type": "GTextField",
      "name": "titleText",
      "x": 145,
      "y": 146,
      "width": 460,
      "height": 60,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "bag-safe-area-root" },
          "data": [6, 0, 10, 0]
        }
      ],
      "text": "我的背包",
      "fontSize": 44,
      "color": "#ffe6a8",
      "bold": true,
      "align": "center",
      "valign": "middle",
      "stroke": 4,
      "strokeColor": "#6a3e12"
    },
    {
      "_$id": "bag-tab-all",
      "_$type": "GButton",
      "name": "allTab",
      "x": 55,
      "y": 218,
      "width": 160,
      "height": 64,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "bag-safe-area-root" },
          "data": [3, 0, 10, 0]
        }
      ],
      "_$child": [
        {
          "_$id": "bag-tab-all-active",
          "_$type": "GLoader",
          "name": "activeBackground",
          "width": 160,
          "height": 64,
          "src": "ui/bag/imgs/tab-selected.png",
          "fitMode": 0
        },
        {
          "_$id": "bag-tab-all-normal",
          "_$type": "GLoader",
          "name": "normalBackground",
          "width": 160,
          "height": 64,
          "visible": false,
          "src": "ui/bag/imgs/tab-normal.png",
          "fitMode": 0
        },
        {
          "_$id": "bag-tab-all-label",
          "_$type": "GTextField",
          "name": "label",
          "width": 160,
          "height": 64,
          "text": "全部",
          "fontSize": 25,
          "color": "#ffffff",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "stroke": 2,
          "strokeColor": "#513116"
        }
      ]
    },
    {
      "_$id": "bag-tab-material",
      "_$type": "GButton",
      "name": "materialTab",
      "x": 215,
      "y": 218,
      "width": 160,
      "height": 64,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "bag-safe-area-root" },
          "data": [3, 0, 10, 0]
        }
      ],
      "_$child": [
        {
          "_$id": "bag-tab-material-active",
          "_$type": "GLoader",
          "name": "activeBackground",
          "width": 160,
          "height": 64,
          "visible": false,
          "src": "ui/bag/imgs/tab-selected.png",
          "fitMode": 0
        },
        {
          "_$id": "bag-tab-material-normal",
          "_$type": "GLoader",
          "name": "normalBackground",
          "width": 160,
          "height": 64,
          "src": "ui/bag/imgs/tab-normal.png",
          "fitMode": 0
        },
        {
          "_$id": "bag-tab-material-label",
          "_$type": "GTextField",
          "name": "label",
          "width": 160,
          "height": 64,
          "text": "材料",
          "fontSize": 25,
          "color": "#ffffff",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "stroke": 2,
          "strokeColor": "#234955"
        }
      ]
    },
    {
      "_$id": "bag-tab-consumable",
      "_$type": "GButton",
      "name": "consumableTab",
      "x": 375,
      "y": 218,
      "width": 160,
      "height": 64,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "bag-safe-area-root" },
          "data": [3, 0, 10, 0]
        }
      ],
      "_$child": [
        {
          "_$id": "bag-tab-consumable-active",
          "_$type": "GLoader",
          "name": "activeBackground",
          "width": 160,
          "height": 64,
          "visible": false,
          "src": "ui/bag/imgs/tab-selected.png",
          "fitMode": 0
        },
        {
          "_$id": "bag-tab-consumable-normal",
          "_$type": "GLoader",
          "name": "normalBackground",
          "width": 160,
          "height": 64,
          "src": "ui/bag/imgs/tab-normal.png",
          "fitMode": 0
        },
        {
          "_$id": "bag-tab-consumable-label",
          "_$type": "GTextField",
          "name": "label",
          "width": 160,
          "height": 64,
          "text": "消耗品",
          "fontSize": 25,
          "color": "#ffffff",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "stroke": 2,
          "strokeColor": "#234955"
        }
      ]
    },
    {
      "_$id": "bag-tab-equipment",
      "_$type": "GButton",
      "name": "equipmentTab",
      "x": 535,
      "y": 218,
      "width": 160,
      "height": 64,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "bag-safe-area-root" },
          "data": [3, 0, 10, 0]
        }
      ],
      "_$child": [
        {
          "_$id": "bag-tab-equipment-active",
          "_$type": "GLoader",
          "name": "activeBackground",
          "width": 160,
          "height": 64,
          "visible": false,
          "src": "ui/bag/imgs/tab-selected.png",
          "fitMode": 0
        },
        {
          "_$id": "bag-tab-equipment-normal",
          "_$type": "GLoader",
          "name": "normalBackground",
          "width": 160,
          "height": 64,
          "src": "ui/bag/imgs/tab-normal.png",
          "fitMode": 0
        },
        {
          "_$id": "bag-tab-equipment-label",
          "_$type": "GTextField",
          "name": "label",
          "width": 160,
          "height": 64,
          "text": "装备",
          "fontSize": 25,
          "color": "#ffffff",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "stroke": 2,
          "strokeColor": "#234955"
        }
      ]
    },
    {
      "_$id": "bag-item-list",
      "_$type": "GList",
      "name": "itemList",
      "x": 71,
      "y": 320,
      "width": 608,
      "height": 715,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "bag-safe-area-root" },
          "data": [6, 0, 10, 0, 24, 0]
        }
      ],
      "layout": {
        "type": 3,
        "rowGap": 18,
        "columnGap": 12,
        "align": 1
      },
      "scroller": {
        "_$type": "Scroller",
        "direction": 0,
        "barDisplay": 5,
        "bouncebackEffect": 1,
        "touchEffect": 1
      },
      "_templateNode": {
        "_$ref": "bag-item-template",
        "_$tmpl": "itemTemplate"
      },
      "_initItemNum": null,
      "_$child": [
        {
          "_$id": "bag-item-template",
          "_$type": "GBox",
          "name": "bagItem",
          "x": 248,
          "width": 112,
          "height": 112,
          "_$child": [
            {
              "_$id": "bag-item-container",
              "_$type": "GBox",
              "name": "itemContainer",
              "width": 112,
              "height": 112
            }
          ]
        }
      ]
    }
  ]
}
