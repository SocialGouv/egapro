import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { App, Container } from "../src/design-system";

export default {
  title: "Layout/App",
  component: App,
} as ComponentMeta<typeof App>;

const Template: ComponentStory<typeof App> = () => (
  <App>
    <Container>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus excepturi cumque nemo numquam corporis
        molestias beatae enim temporibus magnam, minus alias voluptate quidem fuga cupiditate quos qui nostrum? Fugit,
        similique?
      </p>
    </Container>
  </App>
);

export const Default = Template.bind({});
