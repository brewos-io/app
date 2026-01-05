import type { Preview } from "@storybook/react";
import {
  themes as appThemes,
  applyTheme,
  type ThemeId,
} from "../src/lib/themes";
import "../src/styles/index.css";

// Apply default theme on load
applyTheme(appThemes.classic);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "var(--bg)",
        },
        {
          name: "dark",
          value: "#1a0f0a",
        },
      ],
    },
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "classic",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "caramel", title: "Caramel" },
          { value: "toffee", title: "Toffee" },
          { value: "classic", title: "Classic" },
          { value: "mulberry", title: "Mulberry" },
          { value: "espresso", title: "Espresso" },
          { value: "latte", title: "Latte" },
          { value: "rosetta", title: "Rosetta" },
          { value: "cappuccino", title: "Cappuccino" },
          { value: "cortado", title: "Cortado" },
          { value: "roasted", title: "Roasted" },
          { value: "dark-roast", title: "Dark Roast" },
          { value: "midnight", title: "Midnight Brew" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const themeId = (context.globals.theme || "classic") as ThemeId;
      const theme = appThemes[themeId] || appThemes.classic;
      applyTheme(theme);
      return Story();
    },
  ],
};

export default preview;
