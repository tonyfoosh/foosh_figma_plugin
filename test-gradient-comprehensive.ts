// Comprehensive test for gradient border functionality
// This test verifies the gradient border implementation with the user's exact Figma JSON

import { isGradientStroke, htmlBorderImageFromStrokes } from './packages/backend/src/html/builderImpl/htmlColor';
import { htmlGradientBorderStyles } from './packages/backend/src/html/builderImpl/htmlGradientBorder';

// User's exact Figma stroke data
const testStrokes = [
  {
    "blendMode": "NORMAL",
    "type": "GRADIENT_LINEAR",
    "visible": true, // Explicitly set to true
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
];

console.log('=== Testing Gradient Border Implementation ===\n');

// Test 1: Check if gradient is detected
console.log('1. Testing gradient detection:');
const hasGradient = isGradientStroke(testStrokes);
console.log(`   isGradientStroke result: ${hasGradient}`);
console.log(`   Expected: true`);
console.log(`   ✅ Pass: ${hasGradient === true ? 'Yes' : 'No'}\n`);

// Test 2: Check if gradient CSS is generated
console.log('2. Testing gradient CSS generation:');
const gradientCSS = htmlBorderImageFromStrokes(testStrokes);
console.log(`   Generated CSS: ${gradientCSS}`);
console.log(`   Should contain: linear-gradient`);
console.log(`   ✅ Pass: ${gradientCSS.includes('linear-gradient') ? 'Yes' : 'No'}\n`);

// Test 3: Check gradient border styles generation
console.log('3. Testing gradient border styles:');
const borderStyles = htmlGradientBorderStyles(
  testStrokes,
  'INSIDE',
  { all: 1 }, // 1px border
  false // Not JSX
);

console.log(`   needsPseudoElement: ${borderStyles.needsPseudoElement}`);
console.log(`   Expected: true`);
console.log(`   ✅ Pass: ${borderStyles.needsPseudoElement === true ? 'Yes' : 'No'}\n`);

if (borderStyles.needsPseudoElement) {
  console.log('4. Pseudo-element styles:');
  console.log('   Element styles:', borderStyles.elementStyles);
  console.log('   Pseudo-element styles:', borderStyles.pseudoElementStyles);

  // Check for expected properties
  const hasPositionRelative = borderStyles.elementStyles.includes('position: relative');
  const hasMask = borderStyles.pseudoElementStyles.some(s => s.includes('mask'));
  const hasGradientBg = borderStyles.pseudoElementStyles.some(s => s.includes('linear-gradient'));

  console.log(`\n   ✅ Has position:relative: ${hasPositionRelative ? 'Yes' : 'No'}`);
  console.log(`   ✅ Has mask properties: ${hasMask ? 'Yes' : 'No'}`);
  console.log(`   ✅ Has gradient background: ${hasGradientBg ? 'Yes' : 'No'}`);
}

console.log('\n=== Test Complete ===');
console.log('\nExpected HTML output should include:');
console.log('- Element with position: relative');
console.log('- ::before pseudo-element with gradient background');
console.log('- Mask-composite technique for border effect');
console.log('- NO solid border fallback');

// Test edge cases
console.log('\n=== Testing Edge Cases ===\n');

// Test with missing visible property
const strokesNoVisible = [{
  ...testStrokes[0],
  visible: undefined
}];
console.log('5. Stroke without visible property:');
const hasGradientNoVisible = isGradientStroke(strokesNoVisible);
console.log(`   Result: ${hasGradientNoVisible}`);
console.log(`   Expected: true (visible undefined should pass)`);

// Test with visible: false
const strokesInvisible = [{
  ...testStrokes[0],
  visible: false
}];
console.log('\n6. Stroke with visible: false:');
const hasGradientInvisible = isGradientStroke(strokesInvisible);
console.log(`   Result: ${hasGradientInvisible}`);
console.log(`   Expected: false (invisible stroke should fail)`);

console.log('\n=== All Tests Complete ===');