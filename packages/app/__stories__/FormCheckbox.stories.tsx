import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { Box, FormCheckbox } from "@design-system";

export default {
  title: "Base/Form/FormCheckbox",
  component: FormCheckbox,
  parameters: {
    docs: {
      description: {
        component: `Voir la <a href="https://www.systeme-de-design.gouv.fr/elements-d-interface/composants/case-a-cocherx" target="_blank">documentation officielle</a>`,
      },
    },
  },
} as ComponentMeta<typeof FormCheckbox>;

const Template: ComponentStory<typeof FormCheckbox> = args => (
  <>
    <FormCheckbox {...args}>
      J'accepte l'utilisation de mes données à caractère personnel pour réaliser des statistiques et pour vérifier la
      validité de ma déclaration.{" "}
    </FormCheckbox>
    <Box pl="4w">
      Pour en savoir plus sur l'usage de ces données, vous pouvez consulter nos{" "}
      <a href="#">Conditions Générales d'Utilisation</a>.
    </Box>
  </>
);

export const Default = Template.bind({});
Default.args = {
  id: "xxx",
  isError: false,
  isDisabled: false,
};

export const IsError = Template.bind({});
IsError.args = {
  ...Default.args,
  isError: true,
};

export const IsDisabled = Template.bind({});
IsDisabled.args = {
  ...Default.args,
  isDisabled: true,
};
