const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  stories: [
    "../__stories__/**/*.stories.@(js|jsx|ts|tsx|mdx)"
  ],
  refs: {
    '@chakra-ui/react': {
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
    "storybook-addon-next-router"
  ],
  framework: "@storybook/react",
  core: {
    "builder": "@storybook/builder-webpack5"
  },
  async webpackFinal(config, { configType }) {
    config.resolve.plugins = [new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, "../__stories__/tsconfig.json")
    })];
    return config;
  }
}
