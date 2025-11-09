import { getCommonRadius } from "../../common/commonRadius";
import { formatWithJSX } from "../../common/parseJSX";
import {
  shouldUseSquircle,
  generateSquirclePath,
} from "../squircleUtils";

export const htmlBorderRadius = (node: SceneNode, isJsx: boolean): string[] => {
  let comp: string[] = [];

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
