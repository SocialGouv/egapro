import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import { Link } from "../src/design-system"

export default {
  title: "Base/Link",
  component: Link,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://gouvfr.atlassian.net/wiki/spaces/DB/pages/217284725/Liens+-+Links" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof Link>

const Template: ComponentStory<typeof Link> = (args) => <Link {...args} />

export const Default = Template.bind({})
Default.args = { children: "Lien simple", href: "#" }

export const WithSize = () => (
  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
    <Link href="#" size="sm">
      Lien simple
    </Link>
    <Link href="#">Lien simple</Link>
    <Link href="#" size="lg">
      Lien simple
    </Link>
  </div>
)

export const WithIcon = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <Link href="#" iconLeft="fr-icon-arrow-left-line">
      Lien simple
    </Link>
    <Link href="#" iconRight="fr-icon-arrow-right-line">
      Lien simple
    </Link>
  </div>
)
WithIcon.parameters = {
  docs: {
    description: {
      story: `Liste des icônes disponibles : <a href="https://www.systeme-de-design.gouv.fr/elements-d-interface/fondamentaux-techniques/icones" target="_blank">voir la liste officielle</a>`,
    },
  },
}
