import NextLink from "next/link";
import type { NextPageWithLayout } from "../_app";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";
import {
  Box,
  ButtonAsLink,
  FormButton,
  FormLayout,
  FormLayoutButtonGroup,
  RecapSection,
  RecapSectionContent,
  RecapSectionContentItem,
  RecapSectionTitle,
} from "@design-system";

const title = "Validation de vos écarts";

const Validation: NextPageWithLayout = () => {
  return (
    <>
      <h1>{title}</h1>
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
      <Box as="h2" mt="6w">
        Récapitulatif
      </Box>
      <p>Déclaration des écarts de représentation Femmes/Hommes pour l’année 2023 au titre des données 2022.</p>
      <RecapSection>
        <RecapSectionTitle>Informations déclarant</RecapSectionTitle>
        <RecapSectionContent>
          <RecapSectionContentItem legend="Nom Prénom" data="Laetitia Collombet" />
          <RecapSectionContentItem legend="Adresse mail" data="laetitia.collombet@travail.gouv.fr" />
        </RecapSectionContent>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Informations entreprise</RecapSectionTitle>
        <RecapSectionContent>
          <RecapSectionContentItem legend="Raison sociale" data="CENTRE HOSPITALIER REGIONAL DE MARSEILLE" />
          <RecapSectionContentItem legend="Siren" data="261300081" />
          <RecapSectionContentItem legend="Code NAF" data="86.10Z - Activités hospitalières" />
          <RecapSectionContentItem legend="Adresse" data="80 RUE BROCHIER 13005 MARSEILLE 5" />
        </RecapSectionContent>
      </RecapSection>

      <RecapSection>
        <RecapSectionTitle>Période de référence</RecapSectionTitle>
        <RecapSectionContent>
          <RecapSectionContentItem legend="Année au titre de laquelle les écarts sont calculés" data="2021" />
          <RecapSectionContentItem
            legend="Date de fin de la période de douze mois consécutifs correspondant à l’exercice comptable pour le calcul des écarts"
            data="31/12/2021"
          />
        </RecapSectionContent>
      </RecapSection>

      <RecapSection>
        <RecapSectionTitle>Écart de représentation parmi les cadres dirigeants</RecapSectionTitle>
        <RecapSectionContent>
          <RecapSectionContentItem legend="Pourcentage de femmes parmi les cadres dirigeants" data="53 %" />
          <RecapSectionContentItem legend="Pourcentage d’hommes parmi les cadres dirigeants" data="47 %" />
        </RecapSectionContent>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Écart de représentation parmi les membres des instances dirigeantes</RecapSectionTitle>
        <RecapSectionContent>
          <RecapSectionContentItem legend="Motif de non calculabilité" data="Il n'y a aucune instance dirigeante" />
        </RecapSectionContent>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Publication</RecapSectionTitle>
        <RecapSectionContent>
          <RecapSectionContentItem legend="Date de publication" data="01/09/2022" />
          <RecapSectionContentItem legend="Site internet de publication" data="http://siteinternet.fr" />
          <RecapSectionContentItem legend="Modalités de communication auprès des salariés" data="Affichage" />
        </RecapSectionContent>
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
