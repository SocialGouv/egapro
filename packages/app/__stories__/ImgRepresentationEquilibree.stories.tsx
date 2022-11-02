import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { ImgRepresentationEquilibree } from "@design-system";

export default {
  title: "Img/ImgRepresentationEquilibree",
  component: ImgRepresentationEquilibree,
} as ComponentMeta<typeof ImgRepresentationEquilibree>;

const Template: ComponentStory<typeof ImgRepresentationEquilibree> = () => <ImgRepresentationEquilibree />;

export const Default = Template.bind({});
