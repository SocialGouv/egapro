import "@gouvfr/dsfr/dist/dsfr.main.min.css"
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}