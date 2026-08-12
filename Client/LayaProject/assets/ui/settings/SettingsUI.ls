{
  "_$ver": 1,
  "_$id": "settings-ui-root",
  "_$type": "Scene",
  "left": 0,
  "right": 0,
  "top": 0,
  "bottom": 0,
  "name": "SettingsUI",
  "width": 750,
  "height": 1334,
  "_$child": [
    {
      "_$id": "settings-page-backdrop",
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
          "target": { "_$ref": "settings-ui-root" },
          "data": [1, 0, 2, 0]
        }
      ],
      "src": "res://0a7c3be5-1c66-4281-be69-20cb3b133418",
      "autoSize": false
    },
    {
      "_$id": "settings-safe-area-root",
      "_$type": "GBox",
      "name": "safeAreaRoot",
      "width": 750,
      "height": 1334,
      "mouseThrough": true,
      "touchable": false
    },
    {
      "_$id": "settings-panel",
      "_$type": "GImage",
      "name": "panelBackground",
      "x": 35,
      "y": 170,
      "width": 680,
      "height": 830,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "settings-safe-area-root" },
          "data": [6, 0, 13, 0]
        }
      ],
      "src": "res://f4603d4f-ae2b-4e5d-8690-d0c0a1811e48",
      "autoSize": false
    },
    {
      "_$id": "settings-title-bg",
      "_$type": "GImage",
      "name": "titleBackground",
      "x": 145,
      "y": 145,
      "width": 460,
      "height": 100,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "settings-safe-area-root" },
          "data": [6, 0, 13, 0]
        }
      ],
      "src": "res://cf489899-66ec-4629-ac3b-1b35ba20e78f",
      "autoSize": false
    },
    {
      "_$id": "settings-title-text",
      "_$type": "GTextField",
      "name": "titleText",
      "x": 145,
      "y": 163,
      "width": 460,
      "height": 60,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "settings-safe-area-root" },
          "data": [6, 0, 13, 0]
        }
      ],
      "text": "设置",
      "fontSize": 42,
      "color": "#ffe6a8",
      "bold": true,
      "align": "center",
      "valign": "middle",
      "stroke": 4,
      "strokeColor": "#6a3e12"
    },
    {
      "_$id": "settings-close-button",
      "_$type": "GButton",
      "name": "closeButton",
      "x": 665,
      "y": 190,
      "width": 82,
      "height": 82,
      "anchorX": 0.5,
      "anchorY": 0.5,
      "relations": [
        {
          "_$type": "Relation",
          "target": { "_$ref": "settings-safe-area-root" },
          "data": [6, 0, 13, 0]
        }
      ],
      "_$child": [
        {
          "_$id": "settings-close-icon",
          "_$type": "GImage",
          "name": "icon",
          "width": 82,
          "height": 82,
          "src": "res://8cf2fd3a-80bc-406e-9b97-315503616884",
          "autoSize": false
        }
      ]
    },
    {
      "_$id": "settings-master-surface",
      "_$type": "GImage",
      "name": "masterSurface",
      "x": 80,
      "y": 285,
      "width": 590,
      "height": 120,
      "alpha": 0.92,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "src": "res://43f87ea2-ca0d-4322-a165-4abb7bc183f6",
      "autoSize": false
    },
    {
      "_$id": "settings-master-label",
      "_$type": "GTextField",
      "name": "masterLabel",
      "x": 120,
      "y": 310,
      "width": 280,
      "height": 70,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "text": "总静音",
      "fontSize": 30,
      "color": "#5b3d20",
      "bold": true,
      "valign": "middle"
    },
    {
      "_$id": "settings-master-toggle",
      "_$type": "GButton",
      "name": "masterToggle",
      "x": 500,
      "y": 315,
      "width": 130,
      "height": 60,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "_$child": [
        {
          "_$id": "settings-master-toggle-bg",
          "_$type": "GImage",
          "name": "background",
          "width": 130,
          "height": 60,
          "src": "res://21b5d20b-78af-4107-a949-fe466a848592",
          "autoSize": false
        },
        {
          "_$id": "settings-master-toggle-label",
          "_$type": "GTextField",
          "name": "label",
          "width": 130,
          "height": 60,
          "text": "开",
          "fontSize": 26,
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
      "_$id": "settings-music-surface",
      "_$type": "GImage",
      "name": "musicSurface",
      "x": 80,
      "y": 430,
      "width": 590,
      "height": 230,
      "alpha": 0.92,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "src": "res://43f87ea2-ca0d-4322-a165-4abb7bc183f6",
      "autoSize": false
    },
    {
      "_$id": "settings-music-label",
      "_$type": "GTextField",
      "name": "musicLabel",
      "x": 120,
      "y": 450,
      "width": 280,
      "height": 70,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "text": "背景音乐",
      "fontSize": 30,
      "color": "#5b3d20",
      "bold": true,
      "valign": "middle"
    },
    {
      "_$id": "settings-music-toggle",
      "_$type": "GButton",
      "name": "musicToggle",
      "x": 500,
      "y": 455,
      "width": 130,
      "height": 60,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "_$child": [
        {
          "_$id": "settings-music-toggle-bg",
          "_$type": "GImage",
          "name": "background",
          "width": 130,
          "height": 60,
          "src": "res://21b5d20b-78af-4107-a949-fe466a848592",
          "autoSize": false
        },
        {
          "_$id": "settings-music-toggle-label",
          "_$type": "GTextField",
          "name": "label",
          "width": 130,
          "height": 60,
          "text": "开",
          "fontSize": 26,
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
      "_$id": "settings-music-volume-label",
      "_$type": "GTextField",
      "name": "musicVolumeLabel",
      "x": 120,
      "y": 550,
      "width": 180,
      "height": 60,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "text": "音乐音量",
      "fontSize": 26,
      "color": "#5b3d20",
      "bold": true,
      "valign": "middle"
    },
    {
      "_$id": "settings-music-slider",
      "_$type": "GButton",
      "name": "musicSlider",
      "x": 300,
      "y": 555,
      "width": 300,
      "height": 50,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "_$child": [
        {
          "_$id": "settings-music-track",
          "_$type": "GImage",
          "name": "track",
          "y": 20,
          "width": 300,
          "height": 12,
          "src": "res://0a7c3be5-1c66-4281-be69-20cb3b133418",
          "autoSize": false
        },
        {
          "_$id": "settings-music-fill",
          "_$type": "GImage",
          "name": "fill",
          "y": 20,
          "width": 225,
          "height": 12,
          "color": "#31c6d4",
          "src": "res://43f87ea2-ca0d-4322-a165-4abb7bc183f6",
          "autoSize": false
        },
        {
          "_$id": "settings-music-knob",
          "_$type": "GImage",
          "name": "knob",
          "x": 225,
          "y": 25,
          "width": 42,
          "height": 42,
          "anchorX": 0.5,
          "anchorY": 0.5,
          "src": "res://d5295f8e-284f-4ecb-8c61-6bdba2d9c0c3",
          "autoSize": false
        }
      ]
    },
    {
      "_$id": "settings-sound-surface",
      "_$type": "GImage",
      "name": "soundSurface",
      "x": 80,
      "y": 685,
      "width": 590,
      "height": 230,
      "alpha": 0.92,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "src": "res://43f87ea2-ca0d-4322-a165-4abb7bc183f6",
      "autoSize": false
    },
    {
      "_$id": "settings-sound-label",
      "_$type": "GTextField",
      "name": "soundLabel",
      "x": 120,
      "y": 705,
      "width": 280,
      "height": 70,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "text": "音效",
      "fontSize": 30,
      "color": "#5b3d20",
      "bold": true,
      "valign": "middle"
    },
    {
      "_$id": "settings-sound-toggle",
      "_$type": "GButton",
      "name": "soundToggle",
      "x": 500,
      "y": 710,
      "width": 130,
      "height": 60,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "_$child": [
        {
          "_$id": "settings-sound-toggle-bg",
          "_$type": "GImage",
          "name": "background",
          "width": 130,
          "height": 60,
          "src": "res://21b5d20b-78af-4107-a949-fe466a848592",
          "autoSize": false
        },
        {
          "_$id": "settings-sound-toggle-label",
          "_$type": "GTextField",
          "name": "label",
          "width": 130,
          "height": 60,
          "text": "开",
          "fontSize": 26,
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
      "_$id": "settings-sound-volume-label",
      "_$type": "GTextField",
      "name": "soundVolumeLabel",
      "x": 120,
      "y": 805,
      "width": 180,
      "height": 60,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "text": "音效音量",
      "fontSize": 26,
      "color": "#5b3d20",
      "bold": true,
      "valign": "middle"
    },
    {
      "_$id": "settings-sound-slider",
      "_$type": "GButton",
      "name": "soundSlider",
      "x": 300,
      "y": 810,
      "width": 300,
      "height": 50,
      "relations": [
        { "_$type": "Relation", "target": { "_$ref": "settings-safe-area-root" }, "data": [6, 0, 13, 0] }
      ],
      "_$child": [
        {
          "_$id": "settings-sound-track",
          "_$type": "GImage",
          "name": "track",
          "y": 20,
          "width": 300,
          "height": 12,
          "src": "res://0a7c3be5-1c66-4281-be69-20cb3b133418",
          "autoSize": false
        },
        {
          "_$id": "settings-sound-fill",
          "_$type": "GImage",
          "name": "fill",
          "y": 20,
          "width": 225,
          "height": 12,
          "color": "#31c6d4",
          "src": "res://43f87ea2-ca0d-4322-a165-4abb7bc183f6",
          "autoSize": false
        },
        {
          "_$id": "settings-sound-knob",
          "_$type": "GImage",
          "name": "knob",
          "x": 225,
          "y": 25,
          "width": 42,
          "height": 42,
          "anchorX": 0.5,
          "anchorY": 0.5,
          "src": "res://d5295f8e-284f-4ecb-8c61-6bdba2d9c0c3",
          "autoSize": false
        }
      ]
    }
  ]
}
