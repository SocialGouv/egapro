import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import { Alert } from "../src/design-system"

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
} as ComponentMeta<typeof Alert>

const Template: ComponentStory<typeof Alert> = (args) => <Alert {...args} />

export const Default = Template.bind({})
Default.args = {
  title: "Titre du message",
  description: "Description détaillée du message",
}

export const SizeSm = Template.bind({})
SizeSm.args = {
  size: "sm",
  description: "Information : titre de l'information",
}
