import { formatWithJSX } from "../../common/parseJSX";
import { numberToFixedString } from "../../common/numToAutoFixed";
import { htmlBorderImageFromStrokes } from "./htmlColor";
import { BorderSide } from "types";

export interface GradientBorderStyles {
  elementStyles: string[];        // Styles for main element
  pseudoElementStyles: string[];  // Styles for ::before pseudo-element
  needsPseudoElement: boolean;    // Whether to generate pseudo-element
}

/**
 * Generate gradient border styles using ::before pseudo-element with mask
 *
 * This approach creates a border that:
 * 1. Layers ABOVE the background (z-index: 1)
 * 2. Positions INSIDE the element bounds (for strokeAlign: INSIDE)
 * 3. Supports full gradients (using background property)
 * 4. Works with squircles (inherits clip-path)
 *
 * Technique: Uses mask-composite to create border ring effect
 * - Outer mask fills entire pseudo-element
 * - Inner mask fills content-box (excluding padding)
 * - Composite excludes inner from outer = border ring
 */
export function htmlGradientBorderStyles(
  strokes: ReadonlyArray<Paint> | undefined,
  strokeAlign: string,
  borderWidth: BorderSide,
  isJSX: boolean,
): GradientBorderStyles {
  if (!strokes || strokes.length === 0) {
    return {
      elementStyles: [],
      pseudoElementStyles: [],
      needsPseudoElement: false,
    };
  }

  // Get gradient CSS from strokes
  const gradientCSS = htmlBorderImageFromStrokes(strokes);

  // Debug logging for gradient CSS generation
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DEBUG] Gradient CSS from strokes:', {
      gradientCSS,
      strokesLength: strokes?.length,
      topStrokeType: strokes[0]?.type
    });
  }

  if (!gradientCSS) {
    return {
      elementStyles: [],
      pseudoElementStyles: [],
      needsPseudoElement: false,
    };
  }

  // Extract gradient (remove the ' 1' suffix from border-image format)
  const gradient = gradientCSS.replace(/ 1$/, "");

  // Element needs position: relative for pseudo-element positioning
  const elementStyles: string[] = [
    formatWithJSX("position", isJSX, "relative"),
  ];

  // Build pseudo-element styles
  const pseudoElementStyles: string[] = [];

  // Required for pseudo-element
  pseudoElementStyles.push(formatWithJSX("content", isJSX, "''"));
  pseudoElementStyles.push(formatWithJSX("position", isJSX, "absolute"));
  pseudoElementStyles.push(formatWithJSX("pointer-events", isJSX, "none"));
  pseudoElementStyles.push(formatWithJSX("z-index", isJSX, "1"));

  // Calculate inset based on strokeAlign
  let inset: string;
  if ("all" in borderWidth) {
    const width = borderWidth.all;
    switch (strokeAlign) {
      case "CENTER":
        inset = `${numberToFixedString(-width / 2)}px`;
        break;
      case "OUTSIDE":
        inset = `${numberToFixedString(-width)}px`;
        break;
      case "INSIDE":
      default:
        inset = "0";
        break;
    }
    pseudoElementStyles.push(formatWithJSX("inset", isJSX, inset));

    // Padding determines border width (for mask-composite technique)
    pseudoElementStyles.push(
      formatWithJSX("padding", isJSX, `${numberToFixedString(width)}px`)
    );
  } else {
    // Non-uniform border widths
    const { top, right, bottom, left } = borderWidth;

    // Calculate inset for each side based on strokeAlign
    let topInset, rightInset, bottomInset, leftInset;
    switch (strokeAlign) {
      case "CENTER":
        topInset = numberToFixedString(-top / 2);
        rightInset = numberToFixedString(-right / 2);
        bottomInset = numberToFixedString(-bottom / 2);
        leftInset = numberToFixedString(-left / 2);
        break;
      case "OUTSIDE":
        topInset = numberToFixedString(-top);
        rightInset = numberToFixedString(-right);
        bottomInset = numberToFixedString(-bottom);
        leftInset = numberToFixedString(-left);
        break;
      case "INSIDE":
      default:
        topInset = "0";
        rightInset = "0";
        bottomInset = "0";
        leftInset = "0";
        break;
    }

    pseudoElementStyles.push(
      formatWithJSX("top", isJSX, `${topInset}px`)
    );
    pseudoElementStyles.push(
      formatWithJSX("right", isJSX, `${rightInset}px`)
    );
    pseudoElementStyles.push(
      formatWithJSX("bottom", isJSX, `${bottomInset}px`)
    );
    pseudoElementStyles.push(
      formatWithJSX("left", isJSX, `${leftInset}px`)
    );

    // Padding for non-uniform borders
    pseudoElementStyles.push(
      formatWithJSX(
        "padding",
        isJSX,
        `${numberToFixedString(top)}px ${numberToFixedString(right)}px ${numberToFixedString(bottom)}px ${numberToFixedString(left)}px`
      )
    );
  }

  // Apply gradient as background
  pseudoElementStyles.push(formatWithJSX("background", isJSX, gradient));

  // Mask-composite technique to create border ring
  // This creates a border by masking out the center (content-box)
  const maskValue = "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)";
  pseudoElementStyles.push(formatWithJSX("mask", isJSX, maskValue));
  pseudoElementStyles.push(formatWithJSX("-webkit-mask", isJSX, maskValue));

  // mask-composite: exclude removes inner mask from outer, creating border ring
  pseudoElementStyles.push(formatWithJSX("mask-composite", isJSX, "exclude"));
  pseudoElementStyles.push(formatWithJSX("-webkit-mask-composite", isJSX, "xor"));

  // Inherit clip-path from parent for squircle support
  pseudoElementStyles.push(formatWithJSX("clip-path", isJSX, "inherit"));
  pseudoElementStyles.push(formatWithJSX("-webkit-clip-path", isJSX, "inherit"));

  // Border-radius needs to be inherited for rounded corners
  pseudoElementStyles.push(formatWithJSX("border-radius", isJSX, "inherit"));

  return {
    elementStyles,
    pseudoElementStyles,
    needsPseudoElement: true,
  };
}
