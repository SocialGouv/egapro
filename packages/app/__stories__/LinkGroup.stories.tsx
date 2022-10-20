import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { Link, LinkGroup } from "@design-system";

export default {
  title: "Base/LinkGroup",
  component: LinkGroup,
} as ComponentMeta<typeof LinkGroup>;

const Template: ComponentStory<typeof LinkGroup> = args => (
  <LinkGroup {...args}>
    <Link href="#" iconLeft="fr-icon-arrow-right-line">
      Lien simple
    </Link>
    <Link href="#" iconLeft="fr-icon-arrow-right-line">
      Lien simple
    </Link>
  </LinkGroup>
);

export const Default = Template.bind({});
