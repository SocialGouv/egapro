import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { Container } from "../src/design-system";

export default {
  title: "Layout/Container",
  component: Container,
} as ComponentMeta<typeof Container>;

const Template: ComponentStory<typeof Container> = () => (
  <Container>
    <p>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Asperiores eveniet perferendis repudiandae sapiente rem,
      alias recusandae atque molestiae eius architecto quis natus assumenda nemo, consequuntur iste facere vel dolores
      porro.
    </p>
  </Container>
);

export const Default = Template.bind({});
