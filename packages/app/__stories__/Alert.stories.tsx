import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { Alert, AlertTitle } from "@design-system";

export default {
  title: "Base/Alert",
  component: Alert,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://gouvfr.atlassian.net/wiki/spaces/DB/pages/736362500/Alertes+-+Alerts" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof Alert>;

export const Default: ComponentStory<typeof Alert> = args => (
  <Alert {...args}>
    <AlertTitle>Titre du message</AlertTitle>
    <p>Description détaillée du message</p>
  </Alert>
);

export const SizeSm: ComponentStory<typeof Alert> = () => (
  <Alert size="sm">
    <p>Description détaillée du message</p>
  </Alert>
);

export const CustomTitleNode: ComponentStory<typeof Alert> = () => (
  <Alert>
    <AlertTitle as="h1">Titre du message</AlertTitle>
    <p>Description détaillée du message</p>
  </Alert>
);
