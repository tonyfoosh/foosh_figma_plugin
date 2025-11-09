import { CornerRadius } from "types";

export const getCommonRadius = (node: SceneNode): CornerRadius => {
  // Extract cornerSmoothing if available
  const cornerSmoothing =
    "cornerSmoothing" in node ? (node.cornerSmoothing as number) : undefined;

  if ("rectangleCornerRadii" in node) {
    const [topLeft, topRight, bottomRight, bottomLeft] =
      node.rectangleCornerRadii as any;
    if (
      topLeft === topRight &&
      topLeft === bottomRight &&
      topLeft === bottomLeft
    ) {
      return { all: topLeft, cornerSmoothing };
    }

    return {
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
      cornerSmoothing,
    };
  }

  if (
    "cornerRadius" in node &&
    node.cornerRadius !== figma.mixed &&
    node.cornerRadius
  ) {
    return { all: node.cornerRadius, cornerSmoothing };
  }

  if ("topLeftRadius" in node) {
    if (
      node.topLeftRadius === node.topRightRadius &&
      node.topLeftRadius === node.bottomRightRadius &&
      node.topLeftRadius === node.bottomLeftRadius
    ) {
      return { all: node.topLeftRadius, cornerSmoothing };
    }

    return {
      topLeft: node.topLeftRadius,
      topRight: node.topRightRadius,
      bottomRight: node.bottomRightRadius,
      bottomLeft: node.bottomLeftRadius,
      cornerSmoothing,
    };
  }

  return { all: 0, cornerSmoothing };
};
