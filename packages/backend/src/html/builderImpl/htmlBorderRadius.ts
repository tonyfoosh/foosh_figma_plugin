import { getCommonRadius } from "../../common/commonRadius";
import { formatWithJSX } from "../../common/parseJSX";
import {
  shouldUseSquircle,
  generateSquirclePath,
} from "../squircleUtils";

export const htmlBorderRadius = (node: SceneNode, isJsx: boolean): string[] => {
  let comp: string[] = [];

  // Check if this node has a mask child (first child with isMask: true)
  // Masks in Figma are used to clip content to a specific shape.
  // The mask node itself is hidden from rendering (filtered out in htmlWidgetGenerator),
  // and only its shape is used to clip the parent container and its children.
  if ("children" in node && node.children.length > 0) {
    const firstChild = node.children[0];
    if ("isMask" in firstChild && firstChild.isMask === true) {
      // Apply clipping based on mask shape
      if (firstChild.type === "ELLIPSE") {
        // For ellipse masks, calculate the actual position and radii
        // based on the mask's bounds relative to the parent node
        const maskWidth = "width" in firstChild ? (firstChild.width as number) : 0;
        const maskHeight = "height" in firstChild ? (firstChild.height as number) : 0;
        const maskX = "x" in firstChild ? (firstChild.x as number) : 0;
        const maskY = "y" in firstChild ? (firstChild.y as number) : 0;

        const parentWidth = "width" in node ? (node.width as number) : 1;
        const parentHeight = "height" in node ? (node.height as number) : 1;

        // Calculate ellipse center as percentage of parent dimensions
        const centerX = ((maskX + maskWidth / 2) / parentWidth) * 100;
        const centerY = ((maskY + maskHeight / 2) / parentHeight) * 100;

        // Calculate ellipse radii as percentage of parent dimensions
        const radiusX = ((maskWidth / 2) / parentWidth) * 100;
        const radiusY = ((maskHeight / 2) / parentHeight) * 100;

        // Generate clip-path with calculated values
        // Format: ellipse(radiusX radiusY at centerX centerY)
        const clipPathValue = `ellipse(${radiusX.toFixed(2)}% ${radiusY.toFixed(2)}% at ${centerX.toFixed(2)}% ${centerY.toFixed(2)}%)`;

        // This clips the element's border-box, including background-image on children
        // Note: clip-path is well-supported in modern browsers (Chrome 55+, Safari 9.1+, Firefox 54+)
        comp.push(formatWithJSX("clip-path", isJsx, clipPathValue));
      }
      // TODO: Add support for other mask types (RECTANGLE with rounded corners, VECTOR paths)
      // For RECTANGLE masks, we could use clip-path: inset() with border-radius
      // For VECTOR masks, we could use clip-path: path() with the SVG path data

      // Always add overflow: hidden for masks as a fallback for older browsers
      comp.push(formatWithJSX("overflow", isJsx, "hidden"));

      // Note: We still need to process the rest of the node's border-radius
      // so we don't return here, we continue to the clipsContent check
    }
  }

  if (
    "children" in node &&
    node.children.length > 0 &&
    "clipsContent" in node &&
    node.clipsContent === true
  ) {
    comp.push(formatWithJSX("overflow", isJsx, "hidden"));
  }

  if (node.type === "ELLIPSE") {
    comp.push(formatWithJSX("border-radius", isJsx, 9999));
    comp.push(formatWithJSX("overflow", isJsx, "hidden"));
    return comp;
  }

  const radius = getCommonRadius(node);

  // Check if we should use squircle rendering
  if (shouldUseSquircle(radius)) {
    // Get node dimensions for squircle path generation
    const width = "width" in node ? (node.width as number) : 0;
    const height = "height" in node ? (node.height as number) : 0;

    if (width > 0 && height > 0) {
      const path = generateSquirclePath(width, height, radius);
      if (path) {
        // Add clip-path for squircle
        // Escape single quotes in the path
        const escapedPath = path.replace(/'/g, "\\'");
        comp.push(
          formatWithJSX("clip-path", isJsx, `path('${escapedPath}')`)
        );

        // Still add border-radius as fallback for older browsers
        // and for the overflow: hidden behavior
        if ("all" in radius && radius.all > 0) {
          comp.push(formatWithJSX("border-radius", isJsx, radius.all));
        } else if ("topLeft" in radius) {
          const cornerValues = [
            radius.topLeft,
            radius.topRight,
            radius.bottomRight,
            radius.bottomLeft,
          ];
          const cornerProperties = [
            "border-top-left-radius",
            "border-top-right-radius",
            "border-bottom-right-radius",
            "border-bottom-left-radius",
          ];
          for (let i = 0; i < 4; i++) {
            if (cornerValues[i] > 0) {
              comp.push(formatWithJSX(cornerProperties[i], isJsx, cornerValues[i]));
            }
          }
        }

        return comp;
      }
    }
  }

  // Regular border-radius (no squircle)
  let singleCorner: number = 0;

  if ("all" in radius) {
    if (radius.all === 0) {
      return comp;
    }
    singleCorner = radius.all;
    comp.push(formatWithJSX("border-radius", isJsx, radius.all));
  } else {
    const cornerValues = [
      radius.topLeft,
      radius.topRight,
      radius.bottomRight,
      radius.bottomLeft,
    ];

    // Map each corner value to its corresponding CSS property
    const cornerProperties = [
      "border-top-left-radius",
      "border-top-right-radius",
      "border-bottom-right-radius",
      "border-bottom-left-radius",
    ];

    // Add CSS properties for non-zero corner values
    for (let i = 0; i < 4; i++) {
      if (cornerValues[i] > 0) {
        comp.push(formatWithJSX(cornerProperties[i], isJsx, cornerValues[i]));
      }
    }
  }

  return comp;
};
