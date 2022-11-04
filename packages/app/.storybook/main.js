const path = require("path");
const { mergeConfig } = require("vite");
const tsConfigPaths = require("vite-tsconfig-paths").default;

const storiesDir = path.resolve(__dirname, "../__stories__/");

/** @type {import("@storybook/builder-vite").StorybookViteConfig} */
module.exports = {
  framework: "@storybook/react",
  stories: [path.join(storiesDir, "**/*.stories.@(js|jsx|ts|tsx|mdx)")],
  refs: {
    "@chakra-ui/react": {
      disable: true,
    },
  },
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "storybook-dark-mode",
    "@storybook/addon-a11y",
    "@storybook/addon-storysource",
    "@storybook/addon-docs",
    "storybook-addon-next-router",
  ],
  features: {
    storyStoreV7: true,
  },
  core: {
    builder: "@storybook/builder-vite",
    disableTelemetry: true,
  },
  async viteFinal(config) {
    /** @type {import("vite").InlineConfig} */
    const custom = {
      plugins: [
        tsConfigPaths({
          projects: [path.join(storiesDir, "tsconfig.json")],
        }),
      ],
      // Add dependencies to pre-optimization
      optimizeDeps: {
        include: ["storybook-dark-mode", "storybook-addon-next-router"],
      },
      esbuild: {
        target: "esnext",
      },
    };
    return mergeConfig(config, custom);
  },
};
