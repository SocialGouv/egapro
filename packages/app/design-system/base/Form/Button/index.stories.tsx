import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"
import { action } from "@storybook/addon-actions"

import Button from "./index"

export default {
  title: "Base/Form/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://www.systeme-de-design.gouv.fr/elements-d-interface/composants/bouton/" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = (args) => <Button onClick={action("button-click")} {...args} />

export const Default = Template.bind({})
Default.args = { children: "Button" }

export const WithSize = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
    <Button size="sm" onClick={action("button-click")}>
      Button
    </Button>
    <Button onClick={action("button-click")}>Button</Button>
    <Button size="lg" onClick={action("button-click")}>
      Button
    </Button>
  </div>
)

export const WithVariant = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <Button onClick={action("button-click")}>Button</Button>
    <Button variant="secondary" onClick={action("button-click")}>
      Button
    </Button>
    <Button variant="tertiary" onClick={action("button-click")}>
      Button
    </Button>
    <Button variant="tertiary-no-border" onClick={action("button-click")}>
      Button
    </Button>
  </div>
)

export const WithIcon = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <Button onClick={action("button-click")} iconLeft="fr-icon-user-fill">
      Button
    </Button>
    <Button onClick={action("button-click")} iconRight="fr-icon-user-fill">
      Button
    </Button>
    <Button onClick={action("button-click")} iconOnly="fr-icon-user-fill">
      Button
    </Button>
  </div>
)
WithIcon.parameters = {
  docs: {
    description: {
      story: `Liste des icônes disponibles : <a href="https://www.systeme-de-design.gouv.fr/elements-d-interface/fondamentaux-techniques/icones" target="_blank">voir la liste officielle</a>`,
    },
  },
}

export const IsDisabled = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <Button onClick={action("button-click")} isDisabled>
      Button
    </Button>
    <Button variant="secondary" onClick={action("button-click")} isDisabled>
      Button
    </Button>
    <Button variant="tertiary" onClick={action("button-click")} isDisabled>
      Button
    </Button>
    <Button variant="tertiary-no-border" onClick={action("button-click")} isDisabled>
      Button
    </Button>
  </div>
)
