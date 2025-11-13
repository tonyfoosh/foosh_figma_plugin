// Test script for gradient border output
// This tests the Figma JSON with gradient borders that the user provided

const figmaJson = [
  {
    "id": "371:50608",
    "name": "Frame 2147227021",
    "type": "FRAME",
    "scrollBehavior": "SCROLLS",
    "children": [
      {
        "id": "371:50609",
        "name": "BG",
        "type": "RECTANGLE",
        "scrollBehavior": "SCROLLS",
        "blendMode": "PASS_THROUGH",
        "fills": [
          {
            "blendMode": "NORMAL",
            "type": "SOLID",
            "color": {
              "r": 0.5058823823928833,
              "g": 0.03921568766236305,
              "b": 0.4941176474094391,
              "a": 1
            }
          },
          {
            "opacity": 0.20999999344348907,
            "blendMode": "NORMAL",
            "type": "GRADIENT_LINEAR",
            "gradientHandlePositions": [
              {"x": 0.4999999897345919, "y": 0.5555555560845897},
              {"x": 0.4999999815222664, "y": 0.999999953434011},
              {"x": 0.27777779105988126, "y": 0.5555555532330735}
            ],
            "gradientStops": [
              {"color": {"r": 0, "g": 0, "b": 0, "a": 0}, "position": 0.2548076808452606},
              {"color": {"r": 0, "g": 0, "b": 0, "a": 1}, "position": 1}
            ]
          }
        ],
        "strokes": [
          {
            "blendMode": "NORMAL",
            "type": "GRADIENT_LINEAR",
            "visible": true,  // Adding visible: true to ensure it's detected
            "gradientHandlePositions": [
              {"x": 0.038888909712341435, "y": -6.763011484167691e-9},
              {"x": 0.49999998797559164, "y": 0.9999999739229684},
              {"x": -0.46111108063064854, "y": 0.160108015548575}
            ],
            "gradientStops": [
              {
                "color": {
                  "r": 0.9254902005195618,
                  "g": 0.9137254953384399,
                  "b": 0.9725490212440491,
                  "a": 0.20000000298023224
                },
                "position": 0
              },
              {
                "color": {
                  "r": 0.9254902005195618,
                  "g": 0.9137254953384399,
                  "b": 0.9725490212440491,
                  "a": 0
                },
                "position": 0.6217572689056396
              }
            ]
          }
        ],
        "strokeWeight": 1,
        "strokeAlign": "INSIDE",
        "cornerRadius": 16,
        "cornerSmoothing": 1,
        "absoluteBoundingBox": {
          "x": 20596,
          "y": -5054,
          "width": 90,
          "height": 108
        },
        "effects": [
          {
            "type": "BACKGROUND_BLUR",
            "visible": true,
            "radius": 2
          }
        ],
        "width": 90,
        "height": 108,
        "x": 0,
        "y": 0
      }
    ],
    "width": 90,
    "height": 108,
    "x": 0,
    "y": 0
  }
];

// Log the test data
console.log("Testing gradient border with Figma JSON:");
console.log("- Element has GRADIENT_LINEAR stroke");
console.log("- Stroke align: INSIDE");
console.log("- Corner radius: 16px with smoothing: 1");
console.log("- Gradient: rgba(236,233,248,0.2) to rgba(236,233,248,0) at 62.18%");
console.log("\nTo test this:");
console.log("1. Run the plugin with this JSON data");
console.log("2. Check if debug logs show gradient detection");
console.log("3. Verify output includes ::before pseudo-element with gradient");
console.log("4. Confirm gradient appears above background");

// Save the JSON to a file for testing
const fs = require('fs');
fs.writeFileSync('test-gradient-data.json', JSON.stringify(figmaJson, null, 2));
console.log("\nTest data saved to test-gradient-data.json");