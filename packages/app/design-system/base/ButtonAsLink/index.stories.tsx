import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"
import { action } from "@storybook/addon-actions"

import ButtonAsLink from "./index"

export default {
  title: "Base/ButtonAsLink",
  component: ButtonAsLink,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://www.systeme-de-design.gouv.fr/elements-d-interface/composants/bouton/" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof ButtonAsLink>

const Template: ComponentStory<typeof ButtonAsLink> = (args) => <ButtonAsLink href="#" {...args} />

export const Default = Template.bind({})
Default.args = { label: "ButtonAsLink" }

export const WithSize = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
    <ButtonAsLink href="#" size="sm" label="Button" />
    <ButtonAsLink href="#" label="Button" />
    <ButtonAsLink href="#" size="lg" label="Button" />
  </div>
)

export const WithVariant = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <ButtonAsLink href="#" label="Button" />
    <ButtonAsLink href="#" variant="secondary" label="Button" />
    <ButtonAsLink href="#" variant="tertiary" label="Button" />
    <ButtonAsLink href="#" variant="tertiary-no-border" label="Button" />
  </div>
)

export const WithIcon = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <ButtonAsLink href="#" label="Button" iconLeft="fr-icon-theme-fill" />
    <ButtonAsLink href="#" label="Button" iconRight="fr-icon-theme-fill" />
    <ButtonAsLink href="#" label="Button" iconOnly="fr-icon-theme-fill" />
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
    <ButtonAsLink onClick={action("button-click")} label="Button" />
    <ButtonAsLink variant="secondary" label="Button" />
    <ButtonAsLink variant="tertiary" label="Button" />
    <ButtonAsLink variant="tertiary-no-border" label="Button" />
  </div>
)
