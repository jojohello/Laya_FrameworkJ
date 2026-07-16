{
  "_$ver": 1,
  "_$id": "common-dialog-root",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "CommonDialog",
  "width": 750,
  "height": 1334,
  "_$child": [
    {
      "_$id": "common-dialog-mask",
      "_$type": "GBox",
      "name": "modalMask",
      "width": 750,
      "height": 1334,
      "alpha": 0.6,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "common-dialog-root"
          },
          "data": [
            1,
            0,
            2,
            0
          ]
        }
      ]
    },
    {
      "_$id": "common-dialog-panel",
      "_$type": "GBox",
      "name": "panel",
      "x": 55,
      "y": 410,
      "width": 640,
      "height": 399,
      "controllers": {
        "_$type": "Record",
        "dialogButtons": {
          "_$type": "Controller",
          "pages": [
            "confirmOnly",
            "confirmCancel"
          ],
          "_editingIndex": 1
        }
      },
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "common-dialog-root"
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
          "_$id": "common-dialog-panel-bg",
          "_$type": "GImage",
          "name": "panelBackground",
          "width": 640,
          "height": 428,
          "src": "res://426d8b25-ac2e-4152-b43e-4029a9aa8f00",
          "autoSize": false
        },
        {
          "_$id": "common-dialog-title-bg",
          "_$type": "GImage",
          "name": "titleBackground",
          "x": 95,
          "y": -15,
          "width": 450,
          "height": 110,
          "src": "res://cf489899-66ec-4629-ac3b-1b35ba20e78f",
          "autoSize": false
        },
        {
          "_$id": "common-dialog-title-text",
          "_$type": "GTextField",
          "name": "titleText",
          "x": 320,
          "y": 15,
          "width": 540,
          "height": 60,
          "anchorX": 0.5,
          "text": "提示",
          "fontSize": 32,
          "color": "#ffe6a8",
          "bold": true,
          "align": "center",
          "valign": "middle",
          "stroke": 2,
          "strokeColor": "#4c4c44"
        },
        {
          "_$id": "common-dialog-context-text",
          "_$type": "GTextField",
          "name": "contextText",
          "x": 40,
          "y": 130,
          "width": 560,
          "height": 135,
          "text": "弹窗内容",
          "fontSize": 22,
          "color": "#4c4c44",
          "align": "center",
          "valign": "middle",
          "wordWrap": true
        },
        {
          "_$id": "common-dialog-confirm-button",
          "_$type": "GButton",
          "name": "confirmButton",
          "x": 175,
          "y": 300,
          "width": 150,
          "height": 58,
          "gears": [
            {
              "_$type": "GearNumber",
              "controller": {
                "_$ref": "common-dialog-panel",
                "_$ctrl": "dialogButtons"
              },
              "propPath": "x",
              "values": {
                "0": 245,
                "1": 175,
                "_$type": "Record"
              }
            }
          ],
          "title": "确定",
          "_$child": [
            {
              "_$id": "common-dialog-confirm-bg",
              "_$type": "GImage",
              "name": "background",
              "width": 150,
              "height": 58,
              "src": "res://6890b76a-c99d-41e3-8691-fa263122ff18",
              "autoSize": false
            },
            {
              "_$id": "common-dialog-confirm-label",
              "_$type": "GTextField",
              "name": "label",
              "width": 150,
              "height": 58,
              "text": "确定",
              "fontSize": 24,
              "color": "#ffffff",
              "align": "center",
              "valign": "middle"
            }
          ]
        },
        {
          "_$id": "common-dialog-cancel-button",
          "_$type": "GButton",
          "name": "cancelButton",
          "x": 355,
          "y": 300,
          "width": 150,
          "height": 58,
          "gears": [
            {
              "_$type": "GearDisplay",
              "controller": {
                "_$ref": "common-dialog-panel",
                "_$ctrl": "dialogButtons"
              },
              "pages": [
                1
              ]
            }
          ],
          "title": "取消",
          "_$child": [
            {
              "_$id": "common-dialog-cancel-bg",
              "_$type": "GImage",
              "name": "background",
              "width": 150,
              "height": 58,
              "src": "res://21b5d20b-78af-4107-a949-fe466a848592",
              "autoSize": false
            },
            {
              "_$id": "common-dialog-cancel-label",
              "_$type": "GTextField",
              "name": "label",
              "width": 150,
              "height": 58,
              "text": "取消",
              "fontSize": 24,
              "color": "#ffffff",
              "align": "center",
              "valign": "middle"
            }
          ]
        },
        {
          "_$id": "common-dialog-close-button",
          "_$type": "GButton",
          "name": "closeButton",
          "x": 552,
          "y": -7,
          "width": 90,
          "height": 90,
          "title": "×",
          "_$child": [
            {
              "_$id": "common-dialog-close-icon",
              "_$type": "GLoader",
              "name": "icon",
              "width": 90,
              "height": 90,
              "src": "res://8cf2fd3a-80bc-406e-9b97-315503616884"
            },
            {
              "_$id": "common-dialog-close-label",
              "_$type": "GTextField",
              "name": "label",
              "width": 90,
              "height": 80,
              "visible": false,
              "text": "×",
              "fontSize": 34,
              "color": "#4c4c44",
              "align": "center",
              "valign": "middle"
            }
          ]
        }
      ]
    }
  ]
}