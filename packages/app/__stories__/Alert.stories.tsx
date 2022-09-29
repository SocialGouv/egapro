import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { Alert } from "@/design-system";

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

const Template: ComponentStory<typeof Alert> = args => (
  <Alert {...args}>
    <Alert.Title>Titre du message</Alert.Title>
    <Alert.Content>
      <p>Description détaillée du message</p>
    </Alert.Content>
  </Alert>
);

export const Default = Template.bind({});
Default.args = {};

export const SizeSm = Template.bind({});
SizeSm.args = {
  ...Default.args,
  size: "sm",
};

export const CustomTitleNode: ComponentStory<typeof Alert> = () => {
  return (
    <Alert>
      <Alert.Title as="h1">Titre du message</Alert.Title>
      <Alert.Content>
        <p>Description détaillée du message</p>
      </Alert.Content>
    </Alert>
  );
};
