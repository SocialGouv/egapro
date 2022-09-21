import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { ContentWithAside } from "@/design-system";

export default {
  title: "Layout/ContentWithAside",
  component: ContentWithAside,
} as ComponentMeta<typeof ContentWithAside>;

const Template: ComponentStory<typeof ContentWithAside> = () => (
  <ContentWithAside aside={<div>Aside here</div>} content={<div>Content here</div>} />
);

export const Default = Template.bind({});
