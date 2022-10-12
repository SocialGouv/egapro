import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { ImgEcartRep } from "@/design-system";

export default {
  title: "Img/ImgEcartRep",
  component: ImgEcartRep,
} as ComponentMeta<typeof ImgEcartRep>;

const Template: ComponentStory<typeof ImgEcartRep> = () => <ImgEcartRep />;

export const Default = Template.bind({});
