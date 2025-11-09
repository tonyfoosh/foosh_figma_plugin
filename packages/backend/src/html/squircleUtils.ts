import { getSvgPath } from "figma-squircle";
import { CornerRadius } from "types";

/**
 * Checks if a shape should use squircle rendering
 * @param radius - Corner radius information including cornerSmoothing
 * @returns true if cornerSmoothing > 0 and should use squircle
 */
export const shouldUseSquircle = (radius: CornerRadius): boolean => {
  return (
    radius.cornerSmoothing !== undefined &&
    radius.cornerSmoothing > 0 &&
    (("all" in radius && radius.all > 0) ||
      ("topLeft" in radius &&
        (radius.topLeft > 0 ||
          radius.topRight > 0 ||
          radius.bottomRight > 0 ||
          radius.bottomLeft > 0)))
  );
};

/**
 * Generates an SVG path for a squircle shape
 * @param width - Width of the shape
 * @param height - Height of the shape
 * @param radius - Corner radius information including cornerSmoothing
 * @returns SVG path string for use with clip-path CSS property
 */
export const generateSquirclePath = (
  width: number,
  height: number,
  radius: CornerRadius
): string => {
  if (!radius.cornerSmoothing) {
    // No smoothing, return empty string (fallback to regular border-radius)
    return "";
  }

  // Handle uniform corner radius
  if ("all" in radius) {
    return getSvgPath({
      width,
      height,
      cornerRadius: radius.all,
      cornerSmoothing: radius.cornerSmoothing,
    });
  }

  // Handle individual corner radii
  if ("topLeft" in radius) {
    return getSvgPath({
      width,
      height,
      cornerRadius: 0, // Use individual corners instead
      topLeftCornerRadius: radius.topLeft,
      topRightCornerRadius: radius.topRight,
      bottomRightCornerRadius: radius.bottomRight,
      bottomLeftCornerRadius: radius.bottomLeft,
      cornerSmoothing: radius.cornerSmoothing,
    });
  }

  return "";
};

/**
 * Generates CSS clip-path property for squircle shapes
 * @param width - Width of the shape
 * @param height - Height of the shape
 * @param radius - Corner radius information including cornerSmoothing
 * @returns CSS clip-path property string or empty string if not applicable
 */
export const generateSquircleClipPath = (
  width: number,
  height: number,
  radius: CornerRadius
): string => {
  if (!shouldUseSquircle(radius)) {
    return "";
  }

  const path = generateSquirclePath(width, height, radius);
  if (!path) {
    return "";
  }

  // CSS clip-path with SVG path
  // Note: We escape single quotes in the path and use CSS path() function
  const escapedPath = path.replace(/'/g, "\\'");
  return `clip-path: path('${escapedPath}');`;
};

/**
 * Generates inline SVG element for squircle shapes (alternative to clip-path)
 * @param width - Width of the shape
 * @param height - Height of the shape
 * @param radius - Corner radius information including cornerSmoothing
 * @param fillColor - Optional fill color for the SVG
 * @returns SVG element string
 */
export const generateSquircleSvg = (
  width: number,
  height: number,
  radius: CornerRadius,
  fillColor?: string
): string => {
  const path = generateSquirclePath(width, height, radius);
  if (!path) {
    return "";
  }

  const fill = fillColor || "currentColor";
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <path d="${path}" fill="${fill}" />
</svg>`;
};
