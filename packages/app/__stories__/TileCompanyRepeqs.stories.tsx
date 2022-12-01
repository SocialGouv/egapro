import { TileCompanyRepeqs } from "@design-system";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Base/TileCompanyRepeqs",
  component: TileCompanyRepeqs,
} as ComponentMeta<typeof TileCompanyRepeqs>;

export const Default: ComponentStory<typeof TileCompanyRepeqs> = () => {
  return (
    <TileCompanyRepeqs
      entreprise={{
        département: "Hauts-de-Seine",
        région: "Île-de-France",
        raison_sociale: "EDF PEI production électrique insulaire SAS SIEGE",
        siren: "489967687",
        code_naf: "10.71C",
      }}
      représentation_équilibrée={{
        "2017": {
          pourcentage_femmes_cadres: 10,
          pourcentage_femmes_membres: null,
          pourcentage_hommes_cadres: 90,
          pourcentage_hommes_membres: null,
          motif_non_calculabilité_cadres: null,
          motif_non_calculabilité_membres: null,
        },
        "2018": {
          pourcentage_femmes_cadres: 16,
          pourcentage_femmes_membres: null,
          pourcentage_hommes_cadres: 84,
          pourcentage_hommes_membres: null,
          motif_non_calculabilité_cadres: null,
          motif_non_calculabilité_membres: null,
        },
        "2019": {
          pourcentage_femmes_cadres: 10,
          pourcentage_femmes_membres: 22,
          pourcentage_hommes_cadres: 78,
          pourcentage_hommes_membres: 90,
          motif_non_calculabilité_cadres: null,
          motif_non_calculabilité_membres: null,
        },
        "2020": {
          pourcentage_femmes_cadres: 25,
          pourcentage_femmes_membres: 33,
          pourcentage_hommes_cadres: 75,
          pourcentage_hommes_membres: 77,
          motif_non_calculabilité_cadres: null,
          motif_non_calculabilité_membres: null,
        },
        "2021": {
          pourcentage_femmes_cadres: 43,
          pourcentage_femmes_membres: 40,
          pourcentage_hommes_cadres: 57,
          pourcentage_hommes_membres: 60,
          motif_non_calculabilité_cadres: null,
          motif_non_calculabilité_membres: null,
        },
      }}
    />
  );
};
