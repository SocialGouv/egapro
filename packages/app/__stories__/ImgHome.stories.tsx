import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { ImgHome } from "@design-system";

export default {
  title: "Img/ImgHome",
  component: ImgHome,
} as ComponentMeta<typeof ImgHome>;

const Template: ComponentStory<typeof ImgHome> = () => <ImgHome />;

export const Default = Template.bind({});
