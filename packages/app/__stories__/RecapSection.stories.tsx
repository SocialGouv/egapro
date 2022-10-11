import type { ComponentStory, ComponentMeta } from "@storybook/react";

import { RecapSection, RecapSectionContent, RecapSectionTitle, RecapSectionContentItem } from "@/design-system";

export default {
  title: "Base/RecapSection",
  component: RecapSection,
} as ComponentMeta<typeof RecapSection>;

const Template: ComponentStory<typeof RecapSection> = () => (
  <RecapSection>
    <RecapSectionTitle>Informations déclarant</RecapSectionTitle>
    <RecapSectionContent>
      <RecapSectionContentItem legend="Nom Prénom" data="Laetitia Collombet" />
      <RecapSectionContentItem legend="Adresse mail" data="laetitia.collombet@travail.gouv.fr" />
    </RecapSectionContent>
  </RecapSection>
);

export const Default = Template.bind({});

Default.args = {};
