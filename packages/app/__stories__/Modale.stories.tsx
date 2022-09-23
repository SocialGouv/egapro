import { action } from "@storybook/addon-actions";
import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { FormButton, Modale } from "@/design-system";

export default {
  title: "Base/Modale",
  component: Modale,
} as ComponentMeta<typeof Modale>;

const Template: ComponentStory<typeof Modale> = args => <Modale {...args} />;

export const Default = Template.bind({});

const plop = [
  <FormButton key="1" onClick={action("button-click")} variant="tertiary">
    Annuler
  </FormButton>,
  <FormButton key="2" onClick={action("button-click")}>
    Valider
  </FormButton>,
] as const;
Default.args = {
  children: (
    <>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Eos distinctio quam voluptatibus magni sapiente! Sunt
        repellendus dolores similique et perferendis ipsum, voluptatibus minus, eum sint eaque aliquam esse velit iste.
      </p>
    </>
  ),
  isOpen: true,
  onClose: action("onClose"),
  buttons: [
    <FormButton key="1" variant="tertiary" onClick={action("button-pressed")}>
      J'annule
    </FormButton>,
    <FormButton key="2" onClick={action("button-pressed")}>
      J'accepte
    </FormButton>,
  ],
};
