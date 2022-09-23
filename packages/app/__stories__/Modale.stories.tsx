import { action } from "@storybook/addon-actions";
import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { Modale } from "@/design-system";

export default {
  title: "Base/Modale",
  component: Modale,
} as ComponentMeta<typeof Modale>;

const Template: ComponentStory<typeof Modale> = args => <Modale {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: "yolo",
  isOpen: true,
  onClose: action("onClose"),
};
