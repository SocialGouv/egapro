import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { Breadcrumb, BreadcrumbItem } from "@design-system";

export default {
  title: "Base/Breadcrumb",
  component: Breadcrumb,
} as ComponentMeta<typeof Breadcrumb>;

const Template: ComponentStory<typeof Breadcrumb> = () => (
  <Breadcrumb>
    <BreadcrumbItem href="/">Home</BreadcrumbItem>
    <BreadcrumbItem href="/">Page 1</BreadcrumbItem>
    <BreadcrumbItem href="/">Page 1.1</BreadcrumbItem>
    <BreadcrumbItem isCurrent>Current page</BreadcrumbItem>
  </Breadcrumb>
);

export const Default = Template.bind({});
