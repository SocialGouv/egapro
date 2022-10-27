import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { ImgSuccess } from "@design-system";

export default {
  title: "Img/ImgSuccess",
  component: ImgSuccess,
} as ComponentMeta<typeof ImgSuccess>;

const Template: ComponentStory<typeof ImgSuccess> = () => <ImgSuccess />;

export const Default = Template.bind({});
