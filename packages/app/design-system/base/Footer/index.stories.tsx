import React from "react"
import { ComponentStory, ComponentMeta } from "@storybook/react"

import Footer from "./index"
import FooterBody from "./FooterBody/index"
import FooterBodyItem from "./FooterBodyItem/index"
import FooterBottom from "./FooterBottom/index"
import FooterBottomItem from "./FooterBottomItem/index"
import FooterBottomLink from "./FooterBottomLink"
import FooterContentLink from "./FooterContentLink"
import Logo from "../Logo/index"

export default {
  title: "Base/Footer",
  component: Footer,
} as ComponentMeta<typeof Footer>

const Template: ComponentStory<typeof Footer> = (args) => (
  <Footer {...args}>
    <FooterBody
      logo={
        <a href="#">
          <Logo />
        </a>
      }
      description="Représentation Équilibrée a été développé par les équipes de la fabrique numérique des ministères sociaux."
      items={
        <>
          <FooterBodyItem>
            <FooterContentLink href="https://legifrance.gouv.fr" target="_blank" rel="noreferrer">
              legifrance.gouv.fr
            </FooterContentLink>
          </FooterBodyItem>
          <FooterBodyItem>
            <FooterContentLink href="https://legifrance.gouv.fr" target="_blank" rel="noreferrer">
              legifrance.gouv.fr
            </FooterContentLink>
          </FooterBodyItem>
        </>
      }
    />
    <FooterBottom>
      <>
        <FooterBottomItem>
          <FooterBottomLink href="https://legifrance.gouv.fr">Plan du site</FooterBottomLink>
        </FooterBottomItem>
        <FooterBottomItem>
          <FooterBottomLink href="https://legifrance.gouv.fr">Mentions légales</FooterBottomLink>
        </FooterBottomItem>
      </>
    </FooterBottom>
  </Footer>
)

export const Default = Template.bind({})
Default.args = {}
