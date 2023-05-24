import {
  RecapSection,
  RecapSectionItem,
  RecapSectionItemContent,
  RecapSectionItemLegend,
  RecapSectionItems,
  RecapSectionTitle,
} from "@components/next13/RecapSection";

type Props = {
  siren: string;
};

export const InformationEntreprise = (props: PropsWithChildren<Props>) => {
  return (
    // <div style={{ border: "1px solid red", padding: 10 }}>
    <div>
      <RecapSection>
        <RecapSectionTitle>Informations de l’entreprise déclarante</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Raison sociale</RecapSectionItemLegend>
            <RecapSectionItemContent>SARL Sutterlity</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Numéro Siren</RecapSectionItemLegend>
            <RecapSectionItemContent>800168767</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Code NAF</RecapSectionItemLegend>
            <RecapSectionItemContent>63.12Z - Portails internet</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Adresse</RecapSectionItemLegend>
            <RecapSectionItemContent>89 rue Pierre Joigneaux, 92270 Bois-colombes</RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
    </div>
  );
};
