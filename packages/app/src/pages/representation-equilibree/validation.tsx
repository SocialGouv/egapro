import { useAutoAnimate } from "@formkit/auto-animate/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import type { NextPageWithLayout } from "../_app";
import {
  motifNonCalculabiliteCadresOptions,
  motifNonCalculabiliteMembresOptions,
} from "@common/models/representation-equilibree";
import { formatIsoToFr } from "@common/utils/date";
import { ClientOnly } from "@components/ClientOnly";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
import {
  Alert,
  AlertTitle,
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
import { formatAdresse, putRepresentationEquilibree, useConfig, useFormManager, useUser } from "@services/apiClient";

const title = "Validation de vos écarts";

const SERVER_ERROR = `Problème lors de l'envoi de la représentation équilibrée.`;

const Validation: NextPageWithLayout = () => {
  useUser({ redirectTo: "/representation-equilibree/email" });
  const router = useRouter();
  const { formData } = useFormManager();
  const [globalError, setGlobalError] = useState("");
  const [animationParent] = useAutoAnimate<HTMLDivElement>();
  const { config } = useConfig();

  const { nafLabelFromCode } = config;

  const formatMotif = (motif: string): string | undefined => {
    const found =
      motifNonCalculabiliteCadresOptions.find(e => e.value === motif) ||
      motifNonCalculabiliteMembresOptions.find(e => e.value === motif);

    return found?.label;
  };

  const sendRepresentationEquilibree = async () => {
    try {
      await putRepresentationEquilibree(formData);
      router.push("/representation-equilibree/transmission");
    } catch (error) {
      console.error(error);
      setGlobalError(SERVER_ERROR);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const previousPage =
    formData?.isEcartsMembresCalculable === false && formData?.isEcartsCadresCalculable === false
      ? "/representation-equilibree/ecarts-membres"
      : "/representation-equilibree/publication";

  return (
    <ClientOnly>
      <h1>{title}</h1>

      <div ref={animationParent}>
        {globalError && (
          <Alert type="error" size="sm" mb="4w">
            <AlertTitle>Erreur</AlertTitle>
            <p>{globalError}</p>
          </Alert>
        )}
      </div>

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

      <p>
        Déclaration des écarts de représentation Femmes/Hommes pour l’année {formData.year && formData.year + 1} au
        titre des données {formData.year}.
      </p>
      <RecapSection>
        <RecapSectionTitle>Informations déclarant</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Nom Prénom</RecapSectionItemLegend>
            <RecapSectionItemContent>
              {formData.declarant.nom}&nbsp;{formData.declarant.prenom}
            </RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Adresse email</RecapSectionItemLegend>
            <RecapSectionItemContent>{formData.declarant.email}</RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Informations entreprise</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Raison sociale</RecapSectionItemLegend>
            <RecapSectionItemContent>{formData.entreprise?.raison_sociale}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Siren</RecapSectionItemLegend>
            <RecapSectionItemContent>{formData.entreprise?.siren}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Code NAF</RecapSectionItemLegend>
            <RecapSectionItemContent>{nafLabelFromCode(formData.entreprise?.code_naf)}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>Adresse</RecapSectionItemLegend>
            <RecapSectionItemContent>
              {formData.entreprise &&
                formatAdresse(formData.entreprise).map(element => <div key={element}>{element}</div>)}
            </RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Période de référence</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Année au titre de laquelle les écarts sont calculés</RecapSectionItemLegend>
            <RecapSectionItemContent>{formData.year}</RecapSectionItemContent>
          </RecapSectionItem>
          <RecapSectionItem>
            <RecapSectionItemLegend>
              Date de fin de la période de douze mois consécutifs correspondant à l’exercice comptable pour le calcul
              des écarts
            </RecapSectionItemLegend>
            <RecapSectionItemContent>
              {formData.endOfPeriod && formatIsoToFr(formData.endOfPeriod)}
            </RecapSectionItemContent>
          </RecapSectionItem>
        </RecapSectionItems>
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Écart de représentation parmi les cadres dirigeants</RecapSectionTitle>
        {formData.motifEcartsCadresNonCalculable ? (
          <RecapSectionItems>
            <RecapSectionItem>
              <RecapSectionItemLegend>Motif de non calculabilité</RecapSectionItemLegend>
              <RecapSectionItemContent>{formatMotif(formData.motifEcartsCadresNonCalculable)}</RecapSectionItemContent>
            </RecapSectionItem>
          </RecapSectionItems>
        ) : (
          <RecapSectionItems>
            <RecapSectionItem>
              <RecapSectionItemLegend>Pourcentage de femmes parmi les cadres dirigeants</RecapSectionItemLegend>
              <RecapSectionItemContent>{formData.ecartsCadresFemmes}&nbsp;%</RecapSectionItemContent>
            </RecapSectionItem>
            <RecapSectionItem>
              <RecapSectionItemLegend>Pourcentage d’hommes parmi les cadres dirigeants</RecapSectionItemLegend>
              <RecapSectionItemContent>{formData.ecartsCadresHommes}&nbsp;%</RecapSectionItemContent>
            </RecapSectionItem>
          </RecapSectionItems>
        )}
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Écart de représentation parmi les membres des instances dirigeantes</RecapSectionTitle>
        {formData.motifEcartsMembresNonCalculable ? (
          <RecapSectionItems>
            <RecapSectionItem>
              <RecapSectionItemLegend>Motif de non calculabilité</RecapSectionItemLegend>
              <RecapSectionItemContent>{formatMotif(formData.motifEcartsMembresNonCalculable)}</RecapSectionItemContent>
            </RecapSectionItem>
          </RecapSectionItems>
        ) : (
          <RecapSectionItems>
            <RecapSectionItem>
              <RecapSectionItemLegend>
                Pourcentage de femmes parmi les membres des instances dirigeantes
              </RecapSectionItemLegend>
              <RecapSectionItemContent>{formData.ecartsMembresFemmes}&nbsp;%</RecapSectionItemContent>
            </RecapSectionItem>
            <RecapSectionItem>
              <RecapSectionItemLegend>
                Pourcentage d’hommes parmi les membres des instances dirigeantes
              </RecapSectionItemLegend>
              <RecapSectionItemContent>{formData.ecartsMembresHommes}&nbsp;%</RecapSectionItemContent>
            </RecapSectionItem>
          </RecapSectionItems>
        )}
      </RecapSection>
      <RecapSection>
        <RecapSectionTitle>Publication</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemLegend>Date de publication</RecapSectionItemLegend>
            <RecapSectionItemContent>
              {formData.publishingDate && formatIsoToFr(formData.publishingDate)}
            </RecapSectionItemContent>
          </RecapSectionItem>
          {formData.hasWebsite ? (
            <RecapSectionItem>
              <RecapSectionItemLegend>Site internet de publication</RecapSectionItemLegend>
              <RecapSectionItemContent>{formData.publishingWebsiteUrl}</RecapSectionItemContent>
            </RecapSectionItem>
          ) : (
            <RecapSectionItem>
              <RecapSectionItemLegend>Modalités de communication auprès des salariés</RecapSectionItemLegend>
              <RecapSectionItemContent>{formData.publishingContent}</RecapSectionItemContent>
            </RecapSectionItem>
          )}
        </RecapSectionItems>
      </RecapSection>

      <FormLayout>
        <FormLayoutButtonGroup>
          <NextLink href={previousPage} passHref>
            <ButtonAsLink variant="secondary">Précédent</ButtonAsLink>
          </NextLink>
          <FormButton onClick={sendRepresentationEquilibree}>Valider et transmettre les résultats</FormButton>
        </FormLayoutButtonGroup>
      </FormLayout>
    </ClientOnly>
  );
};

Validation.getLayout = ({ children }) => {
  return <RepresentationEquilibreeLayout>{children}</RepresentationEquilibreeLayout>;
};

export default Validation;
