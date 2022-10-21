import NextLink from "next/link";
import type { NextPageWithLayout } from "../_app";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import {
  ButtonAsLink,
  FormButton,
  FormLayout,
  FormLayoutButtonGroup,
  RecapSection,
  RecapSectionItem,
  RecapSectionItemContent,
  RecapSectionItemLegend,
  RecapSectionItems,
  RecapSectionTitle,
} from "@design-system";
import { useUser } from "@services/apiClient";

const Validation: NextPageWithLayout = () => {
  useUser({ redirectTo: "/ecart-rep/email" });

  return (
    <>
      <p>
        Vous êtes sur le point de valider la procédure vous permettant de transmettre aux services du ministre chargé du
        travail vos écarts éventuels de représentation femmes-hommes conformément aux dispositions de l’
        <a
          href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045669617"
          target="_blank"
          rel="noopener noreferrer"
        >
          article D. 1142-19 du code du travail
        </a>
        .
      </p>
      <p>
        Pour terminer la procédure, cliquez sur “Valider et transmettre les résultats” ci-dessous. Vous recevrez un
        accusé de réception par email.
      </p>
      <h2 className="fr-mt-6w">Récapitulatif</h2>
      <p>Déclaration des écarts de représentation Femmes/Hommes pour l’année 2023 au titre des données 2022.</p>
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
      <RecapSection>
        <RecapSectionTitle>Informations entreprise</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Raison sociale</RecapSectionItemLegend>
            <RecapSectionItemContent>CENTRE HOSPITALIER REGIONAL DE MARSEILLE</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Siren</RecapSectionItemLegend>
            <RecapSectionItemContent>261300081</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Code NAF</RecapSectionItemLegend>
            <RecapSectionItemContent>86.10Z - Activités hospitalières</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Adresse</RecapSectionItemLegend>
            <RecapSectionItemContent>80 RUE BROCHIER 13005 MARSEILLE 5</RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Période de référence</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Année au titre de laquelle les écarts sont calculés</RecapSectionItemLegend>
            <RecapSectionItemContent>2021</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>
              Date de fin de la période de douze mois consécutifs correspondant à l’exercice comptable pour le calcul
              des écarts
            </RecapSectionItemLegend>
            <RecapSectionItemContent>31/12/2021</RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Écart de représentation parmi les cadres dirigeants</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Pourcentage de femmes parmi les cadres dirigeants</RecapSectionItemLegend>
            <RecapSectionItemContent>53&nbsp;%</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Pourcentage d’hommes parmi les cadres dirigeants</RecapSectionItemLegend>
            <RecapSectionItemContent>47&nbsp;%</RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Écart de représentation parmi les membres des instances dirigeantes</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Motif de non calculabilité</RecapSectionItemLegend>
            <RecapSectionItemContent>Il n'y a aucune instance dirigeante</RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Publication</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Date de publication</RecapSectionItemLegend>
            <RecapSectionItemContent>01/09/2022</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Site internet de publication</RecapSectionItemLegend>
            <RecapSectionItemContent>http://siteinternet.fr</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Modalités de communication auprès des salariés</RecapSectionItemLegend>
            <RecapSectionItemContent>Affichage</RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
      <form>
        <FormLayout>
          <FormLayoutButtonGroup>
            {/* TODO: add real path */}
            <NextLink href="/" passHref>
              <ButtonAsLink variant="secondary">Précédent</ButtonAsLink>
            </NextLink>
            <FormButton>Valider et transmettre les résultats</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
};

Validation.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default Validation;
