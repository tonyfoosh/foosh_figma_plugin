/**
 * Font collection and CSS generation system
 * Tracks fonts used in the design and generates appropriate imports
 */

import { getFontDataUri } from './fontEmbeds';

interface FontInfo {
  family: string;
  weights: Set<number>;
  styles: Set<string>;
}

type FontCategory = "system" | "google" | "custom";

// Common system fonts that don't need importing
const SYSTEM_FONTS = new Set([
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Times",
  "Courier New",
  "Courier",
  "Verdana",
  "Georgia",
  "Palatino",
  "Garamond",
  "Bookman",
  "Comic Sans MS",
  "Trebuchet MS",
  "Impact",
  "Lucida Sans",
  "Tahoma",
  "Lucida Console",
  "Monaco",
  "Brush Script MT",
  "Luminari",
  "Geneva",
  "Optima",
  "Candara",
  "Calibri",
  "Cambria",
  "Consolas",
  "Segoe UI",
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
]);

// Popular Google Fonts (common ones used in designs)
// This is a subset - in a real app, you might query the Google Fonts API
const GOOGLE_FONTS = new Set([
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Oswald",
  "Source Sans Pro",
  "Raleway",
  "PT Sans",
  "Merriweather",
  "Nunito",
  "Playfair Display",
  "Poppins",
  "Inter",
  "Work Sans",
  "Noto Sans",
  "Rubik",
  "Mukta",
  "Ubuntu",
  "Libre Baskerville",
  "Karla",
]);

export class FontCollector {
  private fonts: Map<string, FontInfo> = new Map();

  /**
   * Add a font to the collection
   */
  addFont(family: string, weight: number = 400, style: string = "normal"): void {
    if (!family) return;

    // Normalize font family name (remove quotes, trim)
    const normalizedFamily = family.replace(/['"]/g, "").trim();

    if (!this.fonts.has(normalizedFamily)) {
      this.fonts.set(normalizedFamily, {
        family: normalizedFamily,
        weights: new Set([weight]),
        styles: new Set([style]),
      });
    } else {
      const fontInfo = this.fonts.get(normalizedFamily)!;
      fontInfo.weights.add(weight);
      fontInfo.styles.add(style);
    }
  }

  /**
   * Categorize a font as system, Google, or custom
   */
  private categorizeFont(family: string): FontCategory {
    if (SYSTEM_FONTS.has(family)) {
      return "system";
    }
    if (GOOGLE_FONTS.has(family)) {
      return "google";
    }
    return "custom";
  }

  /**
   * Generate Google Fonts CSS API v2 URL
   */
  private generateGoogleFontsUrl(googleFonts: FontInfo[]): string {
    if (googleFonts.length === 0) return "";

    const fontParams = googleFonts.map((font) => {
      const weights = Array.from(font.weights).sort((a, b) => a - b);
      const family = font.family.replace(/ /g, "+");
      return `family=${family}:wght@${weights.join(";")}`;
    });

    return `https://fonts.googleapis.com/css2?${fontParams.join("&")}&display=swap`;
  }

  /**
   * Generate @font-face rules for custom fonts
   * Uses base64 embedded fonts for Figma CSP compliance
   * Falls back to S3 URLs for production environments if base64 is not available
   */
  private generateCustomFontFaces(customFonts: FontInfo[]): string {
    if (customFonts.length === 0) return "";

    const fontFaces = customFonts.flatMap((font) => {
      const weights = Array.from(font.weights).sort((a, b) => a - b);
      return weights.map((weight) => {
        // Try to get base64 data URI first (for Figma plugin CSP compliance)
        const dataUri = getFontDataUri(font.family, weight);

        if (dataUri) {
          // Use base64 embedded font (works in Figma plugin, frontend, and Playwright)
          return `@font-face {
  font-family: '${font.family}';
  src: url('${dataUri}') format('woff2');
  font-weight: ${weight};
  font-style: normal;
  font-display: swap;
}`;
        } else {
          // Fallback to S3 URL if base64 not available
          const FONT_BASE_URL = "https://async-workflow-outputs.s3.amazonaws.com/fonts";
          const weightName = this.getWeightName(weight);
          const fileName = `${font.family.replace(/ /g, "")}-${weightName}`;

          return `@font-face {
  font-family: '${font.family}';
  src: url('${FONT_BASE_URL}/${fileName}.woff2') format('woff2');
  font-weight: ${weight};
  font-style: normal;
  font-display: swap;
}`;
        }
      });
    });

    return fontFaces.join("\n\n");
  }

  /**
   * Get human-readable weight name
   */
  private getWeightName(weight: number): string {
    const weightNames: Record<number, string> = {
      100: "Thin",
      200: "ExtraLight",
      300: "Light",
      400: "Regular",
      500: "Medium",
      600: "SemiBold",
      700: "Bold",
      800: "ExtraBold",
      900: "Black",
    };
    return weightNames[weight] || `${weight}`;
  }

  /**
   * Generate complete font CSS (imports + @font-face rules)
   */
  generateFontCSS(): {
    googleFontsUrl: string;
    customFontsCss: string;
    comment: string;
  } {
    if (this.fonts.size === 0) {
      return {
        googleFontsUrl: "",
        customFontsCss: "",
        comment: "",
      };
    }

    // Categorize fonts
    const googleFonts: FontInfo[] = [];
    const customFonts: FontInfo[] = [];
    const systemFonts: string[] = [];

    this.fonts.forEach((fontInfo) => {
      const category = this.categorizeFont(fontInfo.family);
      switch (category) {
        case "google":
          googleFonts.push(fontInfo);
          break;
        case "custom":
          customFonts.push(fontInfo);
          break;
        case "system":
          systemFonts.push(fontInfo.family);
          break;
      }
    });

    // Generate comment about fonts used
    const comment = this.generateFontComment(
      googleFonts,
      customFonts,
      systemFonts
    );

    return {
      googleFontsUrl: this.generateGoogleFontsUrl(googleFonts),
      customFontsCss: this.generateCustomFontFaces(customFonts),
      comment,
    };
  }

  /**
   * Generate a comment explaining the fonts used
   */
  private generateFontComment(
    googleFonts: FontInfo[],
    customFonts: FontInfo[],
    systemFonts: string[]
  ): string {
    const lines: string[] = ["Fonts used in this design:"];

    if (googleFonts.length > 0) {
      lines.push("Google Fonts (auto-loaded):");
      googleFonts.forEach((font) => {
        const weights = Array.from(font.weights).sort((a, b) => a - b);
        lines.push(`  - ${font.family} (weights: ${weights.join(", ")})`);
      });
    }

    if (customFonts.length > 0) {
      lines.push("Custom Fonts (embedded as base64 for Figma CSP compliance):");
      customFonts.forEach((font) => {
        const weights = Array.from(font.weights).sort((a, b) => a - b);
        lines.push(`  - ${font.family} (weights: ${weights.join(", ")})`);
      });
    }

    if (systemFonts.length > 0) {
      lines.push("System Fonts (no import needed):");
      systemFonts.forEach((family) => {
        lines.push(`  - ${family}`);
      });
    }

    return lines.join("\n");
  }

  /**
   * Get all collected font families
   */
  getFontFamilies(): string[] {
    return Array.from(this.fonts.keys());
  }

  /**
   * Clear all collected fonts
   */
  clear(): void {
    this.fonts.clear();
  }

  /**
   * Check if any fonts have been collected
   */
  hasFonts(): boolean {
    return this.fonts.size > 0;
  }
}
