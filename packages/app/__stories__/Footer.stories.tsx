import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { Footer } from "@/design-system";

export default {
  title: "Base/Footer",
  component: Footer,
} as ComponentMeta<typeof Footer>;

const Template: ComponentStory<typeof Footer> = () => <Footer />;

export const Default = Template.bind({});
