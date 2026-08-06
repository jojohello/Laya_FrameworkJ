{
  "_$ver": 1,
  "_$id": "f66zmp2u",
  "_$runtime": "res://507bf804-6e5c-42d0-9e73-25939582d6fe",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "Scene2D",
  "width": 750,
  "height": 1334,
  "mouseThrough": true,
  "_$child": [
    {
      "_$id": "main-safe-area-root",
      "_$type": "GBox",
      "name": "safeAreaRoot",
      "width": 750,
      "height": 1334,
      "mouseThrough": true,
      "touchable": false
    },
    {
      "_$id": "player-profile-instance",
      "_$prefab": "ab8e44cd-91b6-47f5-8a0a-86061addd07c",
      "_$var": true,
      "name": "playerProfile",
      "active": true,
      "x": 12,
      "y": 12,
      "visible": true,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "main-safe-area-root"
          },
          "data": [
            3,
            0,
            10,
            0
          ]
        }
      ]
    },
    {
      "_$id": "dgyiz0mt",
      "_$type": "GBox",
      "name": "buttom",
      "x": -16,
      "y": 1073,
      "width": 768,
      "height": 255,
      "mouseThrough": true,
      "relations": [
        {
          "_$type": "Relation",
          "target": {
            "_$ref": "main-safe-area-root"
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
          "_$id": "al4fryja",
          "_$type": "GImage",
          "name": "bottom_bg",
          "x": 17,
          "y": 58,
          "width": 750,
          "height": 279,
          "alpha": 0.92,
          "relations": [
            {
              "_$type": "Relation",
              "target": {
                "_$ref": "dgyiz0mt"
              },
              "data": [
                1,
                0
              ]
            }
          ],
          "src": "res://38c366c3-2c67-4c9e-8af4-9853bb9467cd",
          "autoSize": false
        },
        {
          "_$id": "p520nko3",
          "_$var": true,
          "_$type": "GList",
          "name": "btn_list",
          "x": 391,
          "y": 71,
          "width": 716,
          "height": 183,
          "anchorX": 0.5,
          "relations": [
            {
              "_$type": "Relation",
              "target": {
                "_$ref": "dgyiz0mt"
              },
              "data": [
                6,
                0
              ]
            }
          ],
          "layout": {
            "type": 2,
            "columnGap": 22,
            "padding": [
              42,
              0,
              0,
              0
            ],
            "align": 1
          },
          "_templateNode": {
            "_$ref": "focqn7gp",
            "_$tmpl": "itemTemplate"
          },
          "_initItemNum": 5,
          "_isDemo": true,
          "_itemData": [],
          "_$child": [
            {
              "_$id": "focqn7gp",
              "_$prefab": "6e4ab31d-eab1-417a-b5fa-03ab031bb6d8",
              "name": "systemBtn",
              "active": true,
              "x": 53,
              "y": 50,
              "visible": true
            }
          ]
        }
      ]
    }
  ]
}
