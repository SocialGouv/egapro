import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { Box } from "@design-system";

export default {
  title: "Base/Box",
  component: Box,
} as ComponentMeta<typeof Box>;

const Template: ComponentStory<typeof Box> = args => <Box my="6w" {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: (
    <p>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Eveniet minus expedita tempora, esse officia est totam
      corrupti cupiditate delectus animi ullam consequatur id, culpa quasi pariatur. Beatae iste delectus molestias.
    </p>
  ),
};
