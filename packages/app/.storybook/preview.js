import "@gouvfr/dsfr/dist/dsfr.main.min.css"
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-user/icons-user.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-business/icons-business.min.css';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}