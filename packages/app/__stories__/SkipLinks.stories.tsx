import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { SkipLinks, SkipLinksItem } from "@/design-system";

export default {
  title: "Base/SkipLinks",
  component: SkipLinks,
} as ComponentMeta<typeof SkipLinks>;

const Template: ComponentStory<typeof SkipLinks> = args => (
  <SkipLinks {...args}>
    <SkipLinksItem href="#content">Contenu</SkipLinksItem>
    <SkipLinksItem href="#header">Menu</SkipLinksItem>
    <SkipLinksItem href="#footer">Pied de page</SkipLinksItem>
  </SkipLinks>
);

export const Default = Template.bind({});
Default.args = {};
