import { action } from "@storybook/addon-actions";
import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { FormButton, Modale } from "@/design-system";

export default {
  title: "Base/Modale",
  component: Modale,
} as ComponentMeta<typeof Modale>;

const Template: ComponentStory<typeof Modale> = args => (
  <Modale {...args}>
    <Modale.Title>Titre de la modale</Modale.Title>
    <Modale.Content>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Eos distinctio quam voluptatibus magni sapiente! Sunt
        repellendus dolores similique et perferendis ipsum, voluptatibus minus, eum sint eaque aliquam esse velit iste.
      </p>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Eos distinctio quam voluptatibus magni sapiente! Sunt
        repellendus dolores similique et perferendis ipsum, voluptatibus minus, eum sint eaque aliquam esse velit iste.
      </p>
    </Modale.Content>
    <FormButton variant="tertiary" onClick={action("button-pressed")}>
      Label bouton
    </FormButton>
    <FormButton onClick={action("button-pressed")}>Label bouton</FormButton>
  </Modale>
);

export const Default = Template.bind({});

Default.args = {
  isOpen: true,
  onClose: action("onClose"),
};
