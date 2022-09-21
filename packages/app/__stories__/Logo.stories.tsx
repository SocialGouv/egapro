import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { Logo } from "@/design-system";

export default {
  title: "Base/Logo",
  component: Logo,
} as ComponentMeta<typeof Logo>;

const Template: ComponentStory<typeof Logo> = () => <Logo />;

export const Default = Template.bind({});
Default.args = {};
