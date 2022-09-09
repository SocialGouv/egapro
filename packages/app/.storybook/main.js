module.exports = {
  stories: [
    "../design-system/**/*.stories.@(js|jsx|ts|tsx|mdx)"
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
    "@storybook/addon-docs"
  ],
  framework: "@storybook/react",
  core: {
    "builder": "@storybook/builder-webpack5"
  }
}