export const commonLineHeight = (
  lineHeight: LineHeight,
  fontSize: number,
): number => {
  switch (lineHeight.unit) {
    case "AUTO":
      // Return fontSize to create tight line-height that matches Figma's behavior
      // This prevents browsers from using their default line-height (typically 1.2x)
      return fontSize;
    case "PIXELS":
      return lineHeight.value;
    case "PERCENT":
      return (fontSize * lineHeight.value) / 100;
  }
};

export const commonLetterSpacing = (
  letterSpacing: LetterSpacing,
  fontSize: number,
): number | string => {
  switch (letterSpacing.unit) {
    case "PIXELS":
      // Round to 2 decimal places to avoid sub-pixel differences
      const pixelValue = Math.round(letterSpacing.value * 100) / 100;

      // Filter out negative values (cause cross-platform issues) or very small values
      if (pixelValue < 0 || Math.abs(pixelValue) < 0.5) {
        // Negative letter-spacing and small values are inconsistent across platforms
        return 0;
      }
      return pixelValue;
    case "PERCENT":
      // Use 'em' units for better cross-platform consistency
      // letterSpacing.value is already a percentage (e.g., -3 for -3%)
      const emValue = letterSpacing.value / 100;
      // Round to 3 decimal places for cleaner CSS
      return `${Math.round(emValue * 1000) / 1000}em`;
  }
};
