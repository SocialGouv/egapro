import type { ComponentStory, ComponentMeta } from "@storybook/react";
import { Stepper, StepperDetails, StepperTitle } from "@design-system";

export default {
  title: "Base/Stepper",
  component: Stepper,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://www.systeme-de-design.gouv.fr/elements-d-interface/composants/indicateur-d-etape" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof Stepper>;

export const Default: ComponentStory<typeof Stepper> = args => {
  return (
    <Stepper {...args}>
      <StepperTitle currentStep={1} numberOfSteps={3}>
        Titre de l’étape en cours
      </StepperTitle>
      <StepperDetails>Titre de la prochaine étape</StepperDetails>
    </Stepper>
  );
};

export const FinalStep: ComponentStory<typeof Stepper> = args => {
  return (
    <Stepper {...args}>
      <StepperTitle currentStep={9} numberOfSteps={3}>
        Titre de l’étape en cours
      </StepperTitle>
    </Stepper>
  );
};
