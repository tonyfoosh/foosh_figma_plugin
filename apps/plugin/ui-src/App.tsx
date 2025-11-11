import { useEffect, useState } from "react";
import { PluginUI } from "plugin-ui";
import {
  Framework,
  PluginSettings,
  ConversionMessage,
  Message,
  HTMLPreview,
  LinearGradientConversion,
  SolidColorConversion,
  ErrorMessage,
  SettingsChangedMessage,
  Warning,
} from "types";
import { postUISettingsChangingMessage } from "./messaging";
import copy from "copy-to-clipboard";

interface AppState {
  code: string;
  selectedFramework: Framework;
  isLoading: boolean;
  htmlPreview: HTMLPreview;
  settings: PluginSettings | null;
  colors: SolidColorConversion[];
  gradients: LinearGradientConversion[];
  warnings: Warning[];
}

const emptyPreview = { size: { width: 0, height: 0 }, content: "" };

export default function App() {
  const [state, setState] = useState<AppState>({
    code: "",
    selectedFramework: "HTML",
    isLoading: false,
    htmlPreview: emptyPreview,
    settings: null,
    colors: [],
    gradients: [],
    warnings: [],
  });

  const rootStyles = getComputedStyle(document.documentElement);
  const figmaColorBgValue = rootStyles
    .getPropertyValue("--figma-color-bg")
    .trim();

  useEffect(() => {
    // Tell the backend that the UI is ready
    console.log("[ui] Sending ui-ready message to backend");
    parent.postMessage({ pluginMessage: { type: "ui-ready" } }, "*");

    window.onmessage = (event: MessageEvent) => {
      const untypedMessage = event.data.pluginMessage as Message;
      console.log("[ui] message received:", untypedMessage);

      switch (untypedMessage.type) {
        case "conversionStart":
          setState((prevState) => ({
            ...prevState,
            code: "",
            isLoading: true,
          }));
          break;

        case "code":
          const conversionMessage = untypedMessage as ConversionMessage;
          console.log("[ui] Received 'code' message:", {
            codeLength: conversionMessage.code?.length || 0,
            hasHtmlPreview: !!conversionMessage.htmlPreview,
            htmlPreviewLength: conversionMessage.htmlPreview?.content?.length || 0,
            colorsCount: conversionMessage.colors?.length || 0,
            gradientsCount: conversionMessage.gradients?.length || 0,
            warningsCount: conversionMessage.warnings?.length || 0,
            framework: conversionMessage.settings?.framework
          });
          setState((prevState) => {
            const newState = {
              ...prevState,
              ...conversionMessage,
              selectedFramework: conversionMessage.settings.framework,
              isLoading: false,
            };
            console.log("[ui] State updated after 'code' message:", {
              codeLength: newState.code?.length || 0,
              hasHtmlPreview: !!newState.htmlPreview,
              colorsCount: newState.colors?.length || 0,
              gradientsCount: newState.gradients?.length || 0,
              warningsCount: newState.warnings?.length || 0,
              isLoading: newState.isLoading
            });
            return newState;
          });
          break;

        case "pluginSettingChanged":
          const settingsMessage = untypedMessage as SettingsChangedMessage;
          setState((prevState) => ({
            ...prevState,
            settings: settingsMessage.settings,
            selectedFramework: settingsMessage.settings.framework,
          }));
          break;

        case "empty":
          // const emptyMessage = untypedMessage as EmptyMessage;
          setState((prevState) => ({
            ...prevState,
            code: "",
            htmlPreview: emptyPreview,
            warnings: [],
            colors: [],
            gradients: [],
            isLoading: false,
          }));
          break;

        case "error":
          const errorMessage = untypedMessage as ErrorMessage;

          setState((prevState) => ({
            ...prevState,
            colors: [],
            gradients: [],
            code: `Error :(\n// ${errorMessage.error}`,
            isLoading: false,
          }));
          break;

        case "selection-json":
          const json = event.data.pluginMessage.data;
          copy(JSON.stringify(json, null, 2));
          break;

        default:
          console.log("[ui] Unhandled message type:", untypedMessage.type);
          break;
      }
    };

    return () => {
      window.onmessage = null;
    };
  }, []);

  const handleFrameworkChange = (updatedFramework: Framework) => {
    // Framework is always HTML - no switching needed
  };
  const handlePreferencesChange = (
    key: keyof PluginSettings,
    value: boolean | string | number,
  ) => {
    if (state.settings && state.settings[key] === value) {
      // do nothing
    } else {
      postUISettingsChangingMessage(key, value, { targetOrigin: "*" });
    }
  };

  const darkMode = figmaColorBgValue !== "#ffffff";

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <PluginUI
        isLoading={state.isLoading}
        code={state.code}
        warnings={state.warnings}
        selectedFramework={state.selectedFramework}
        setSelectedFramework={handleFrameworkChange}
        onPreferenceChanged={handlePreferencesChange}
        htmlPreview={state.htmlPreview}
        settings={state.settings}
        colors={state.colors}
        gradients={state.gradients}
      />
    </div>
  );
}
