import type { ComponentStory, ComponentMeta } from "@storybook/react";

import {
  RecapSection,
  RecapSectionItems,
  RecapSectionItem,
  RecapSectionTitle,
  RecapSectionItemLegend,
  RecapSectionItemContent,
} from "@/design-system";

export default {
  title: "Base/RecapSection",
  component: RecapSection,
} as ComponentMeta<typeof RecapSection>;

const Template: ComponentStory<typeof RecapSection> = () => (
  <RecapSection>
    <RecapSectionTitle>Informations déclarant</RecapSectionTitle>
    <RecapSectionItems>
      <RecapSectionItem>
        <RecapSectionItemLegend>Nom Prénom</RecapSectionItemLegend>
        <RecapSectionItemContent>Lætitia Collombet</RecapSectionItemContent>
      </RecapSectionItem>
      <RecapSectionItem>
        <RecapSectionItemLegend>Adresse mail</RecapSectionItemLegend>
        <RecapSectionItemContent>laetitia.collombet@travail.gouv.f</RecapSectionItemContent>
      </RecapSectionItem>
    </RecapSectionItems>
  </RecapSection>
);

export const Default = Template.bind({});

Default.args = {};
