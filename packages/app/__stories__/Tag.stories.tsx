import { Tag } from "@design-system";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Base/Tag",
  component: Tag,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://gouvfr.atlassian.net/wiki/spaces/DB/pages/310706305/Tag" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof Tag>;

const Template: ComponentStory<typeof Tag> = args => <Tag {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: "Label tag",
};

export const WithVariant = () => (
  <div style={{ display: "flex", gap: "1rem" }}>
    <Tag variant="info">Label tag</Tag>
    <Tag variant="error">Label tag</Tag>
    <Tag variant="success">Label tag</Tag>
    <Tag variant="warning">Label tag</Tag>
  </div>
);
