import {
  ConversionMessage,
  ConversionStartMessage,
  EmptyMessage,
  ErrorMessage,
  PluginSettings,
  SettingsChangedMessage,
} from "types";

export const postBackendMessage = figma.ui.postMessage;

// Cache the last conversion message so we can resend it when UI is ready
let cachedConversionMessage: any = null;

export const getCachedConversionMessage = () => cachedConversionMessage;

export const postEmptyMessage = () =>
  postBackendMessage({ type: "empty" } as EmptyMessage);

export const postConversionStart = () =>
  postBackendMessage({ type: "conversionStart" } as ConversionStartMessage);

export const postConversionComplete = (
  conversionData: ConversionMessage | Omit<ConversionMessage, "type">,
) => {
  const message = { ...conversionData, type: "code" };

  // Cache the message
  cachedConversionMessage = message;
  console.log("[DEBUG] postConversionComplete - Cached and sending message to UI:", {
    type: message.type,
    codeLength: (message as any).code?.length || 0,
    hasHtmlPreview: !!(message as any).htmlPreview,
    colorsCount: (message as any).colors?.length || 0,
    gradientsCount: (message as any).gradients?.length || 0,
    warningsCount: (message as any).warnings?.length || 0,
  });
  return postBackendMessage(message);
};

export const postError = (error: string) =>
  postBackendMessage({ type: "error", error } as ErrorMessage);

export const postSettingsChanged = (settings: PluginSettings) =>
  postBackendMessage({
    type: "pluginSettingsChanged",
    settings,
  } as SettingsChangedMessage);
