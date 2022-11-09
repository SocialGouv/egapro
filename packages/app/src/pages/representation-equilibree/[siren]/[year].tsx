import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";
import type { NextPageWithLayout } from "../../_app";
import type { RepresentationEquilibreeAPI } from "@common/models/representation-equilibree";
import {
  motifNonCalculabiliteCadresOptions,
  motifNonCalculabiliteMembresOptions,
} from "@common/models/representation-equilibree";
import { formatIsoToFr } from "@common/utils/date";
import { normalizeQueryParam } from "@common/utils/router";
import { ClientOnly } from "@components/ClientOnly";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
import {
  Alert,
  AlertTitle,
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
import { formatAdresse, useConfig, useRepresentationEquilibree, useUser } from "@services/apiClient";

const title = "Récapitulatif de la Représentation Équilibrée";

const Validation: NextPageWithLayout = () => {
  const { user } = useUser({ redirectTo: "/representation-equilibree/email" });
  const router = useRouter();
  const { siren, year } = router.query;
  const { repeq, error } = useRepresentationEquilibree(normalizeQueryParam(siren), Number(normalizeQueryParam(year)));
  const { config } = useConfig();
  const [globalError, setGlobalError] = useState("");
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  useEffect(() => {
    if (!user?.ownership.find(elt => elt === siren) && !user?.staff) {
      setGlobalError("Vous n'êtes pas autorisé pour ce Siren.");
    }
  }, [user, router, siren]);

  const { nafLabelFromCode } = config;

  const formatMotif = (motif: string): string | undefined => {
    const found =
      motifNonCalculabiliteCadresOptions.find(e => e.value === motif) ||
      motifNonCalculabiliteMembresOptions.find(e => e.value === motif);

    return found?.label;
  };
  const { déclarant, entreprise, indicateurs, déclaration } =
    repeq?.data || ({} as Partial<RepresentationEquilibreeAPI["data"]>);

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
      {!repeq && <p>Aucune répartition équilibrée n'a été trouvée.</p>}

      {repeq && (
        <>
          <p>
            Vous êtes sur le point de valider la procédure vous permettant de transmettre aux services du ministre
            chargé du travail vos écarts éventuels de représentation femmes-hommes conformément aux dispositions de l’
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
            Déclaration des écarts de représentation Femmes/Hommes pour l’année {Number(year) + 1} au titre des données{" "}
            {year}.
          </p>
          <RecapSection>
            <RecapSectionTitle>Date de déclaration</RecapSectionTitle>
            <RecapSectionItems>
              <RecapSectionItem>
                <RecapSectionItemContent>
                  {déclaration?.date && formatIsoToFr(déclaration?.date)}
                </RecapSectionItemContent>
              </RecapSectionItem>
            </RecapSectionItems>
          </RecapSection>{" "}
          <RecapSection>
            <RecapSectionTitle>Informations déclarant</RecapSectionTitle>
            <RecapSectionItems>
              <RecapSectionItem>
                <RecapSectionItemLegend>Nom Prénom</RecapSectionItemLegend>
                <RecapSectionItemContent>
                  {déclarant?.nom}&nbsp;{déclarant?.prénom}
                </RecapSectionItemContent>
              </RecapSectionItem>
              <RecapSectionItem>
                <RecapSectionItemLegend>Adresse email</RecapSectionItemLegend>
                <RecapSectionItemContent>{déclarant?.email}</RecapSectionItemContent>
              </RecapSectionItem>
            </RecapSectionItems>
          </RecapSection>
          <RecapSection>
            <RecapSectionTitle>Informations entreprise</RecapSectionTitle>
            <RecapSectionItems>
              <RecapSectionItem>
                <RecapSectionItemLegend>Raison sociale</RecapSectionItemLegend>
                <RecapSectionItemContent>{entreprise?.raison_sociale}</RecapSectionItemContent>
              </RecapSectionItem>
              <RecapSectionItem>
                <RecapSectionItemLegend>Siren</RecapSectionItemLegend>
                <RecapSectionItemContent>{entreprise?.siren}</RecapSectionItemContent>
              </RecapSectionItem>
              <RecapSectionItem>
                <RecapSectionItemLegend>Code NAF</RecapSectionItemLegend>
                <RecapSectionItemContent>{nafLabelFromCode(entreprise?.code_naf)}</RecapSectionItemContent>
              </RecapSectionItem>
              <RecapSectionItem>
                <RecapSectionItemLegend>Adresse</RecapSectionItemLegend>
                <RecapSectionItemContent>
                  {entreprise && formatAdresse(entreprise).map(element => <div key={element}>{element}</div>)}
                </RecapSectionItemContent>
              </RecapSectionItem>
            </RecapSectionItems>
          </RecapSection>
          <RecapSection>
            <RecapSectionTitle>Période de référence</RecapSectionTitle>
            <RecapSectionItems>
              <RecapSectionItem>
                <RecapSectionItemLegend>Année au titre de laquelle les écarts sont calculés</RecapSectionItemLegend>
                <RecapSectionItemContent>{year}</RecapSectionItemContent>
              </RecapSectionItem>
              <RecapSectionItem>
                <RecapSectionItemLegend>
                  Date de fin de la période de douze mois consécutifs correspondant à l’exercice comptable pour le
                  calcul des écarts
                </RecapSectionItemLegend>
                <RecapSectionItemContent>
                  {déclaration?.fin_période_référence && formatIsoToFr(déclaration.fin_période_référence)}
                </RecapSectionItemContent>
              </RecapSectionItem>
            </RecapSectionItems>
          </RecapSection>
          <RecapSection>
            <RecapSectionTitle>Écart de représentation parmi les cadres dirigeants</RecapSectionTitle>
            {indicateurs?.représentation_équilibrée.motif_non_calculabilité_cadres ? (
              <RecapSectionItems>
                <RecapSectionItem>
                  <RecapSectionItemLegend>Motif de non calculabilité</RecapSectionItemLegend>{" "}
                  <RecapSectionItemContent>
                    {" "}
                    {formatMotif(indicateurs.représentation_équilibrée.motif_non_calculabilité_cadres)}{" "}
                  </RecapSectionItemContent>{" "}
                </RecapSectionItem>
              </RecapSectionItems>
            ) : (
              <RecapSectionItems>
                <RecapSectionItem>
                  <RecapSectionItemLegend>Pourcentage de femmes parmi les cadres dirigeants</RecapSectionItemLegend>
                  <RecapSectionItemContent>
                    {indicateurs?.représentation_équilibrée.pourcentage_femmes_cadres}&nbsp;%
                  </RecapSectionItemContent>
                </RecapSectionItem>
                <RecapSectionItem>
                  <RecapSectionItemLegend>Pourcentage d’hommes parmi les cadres dirigeants</RecapSectionItemLegend>
                  <RecapSectionItemContent>
                    {indicateurs?.représentation_équilibrée.pourcentage_hommes_cadres}&nbsp;%
                  </RecapSectionItemContent>
                </RecapSectionItem>
              </RecapSectionItems>
            )}
          </RecapSection>
          <RecapSection>
            <RecapSectionTitle>Écart de représentation parmi les membres des instances dirigeantes</RecapSectionTitle>
            {indicateurs?.représentation_équilibrée.motif_non_calculabilité_membres ? (
              <RecapSectionItems>
                <RecapSectionItem>
                  <RecapSectionItemLegend>Motif de non calculabilité</RecapSectionItemLegend>
                  <RecapSectionItemContent>
                    {formatMotif(indicateurs?.représentation_équilibrée.motif_non_calculabilité_membres)}
                  </RecapSectionItemContent>
                </RecapSectionItem>
              </RecapSectionItems>
            ) : (
              <RecapSectionItems>
                <RecapSectionItem>
                  <RecapSectionItemLegend>
                    Pourcentage de femmes parmi les membres des instances dirigeantes
                  </RecapSectionItemLegend>
                  <RecapSectionItemContent>
                    {indicateurs?.représentation_équilibrée.pourcentage_femmes_membres}&nbsp;%
                  </RecapSectionItemContent>
                </RecapSectionItem>
                <RecapSectionItem>
                  <RecapSectionItemLegend>
                    Pourcentage d’hommes parmi les membres des instances dirigeantes
                  </RecapSectionItemLegend>
                  <RecapSectionItemContent>
                    {indicateurs?.représentation_équilibrée.pourcentage_hommes_membres}&nbsp;%
                  </RecapSectionItemContent>
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
                  {déclaration?.publication && formatIsoToFr(déclaration.publication.date)}
                </RecapSectionItemContent>
              </RecapSectionItem>
              {déclaration?.publication?.url ? (
                <RecapSectionItem>
                  <RecapSectionItemLegend>Site internet de publication</RecapSectionItemLegend>
                  <RecapSectionItemContent>{déclaration?.publication?.url}</RecapSectionItemContent>
                </RecapSectionItem>
              ) : (
                <RecapSectionItem>
                  <RecapSectionItemLegend>Modalités de communication auprès des salariés</RecapSectionItemLegend>
                  <RecapSectionItemContent>{déclaration?.publication?.modalités}</RecapSectionItemContent>
                </RecapSectionItem>
              )}
            </RecapSectionItems>
          </RecapSection>
          <FormLayout>
            <FormLayoutButtonGroup>
              <FormButton onClick={() => router.push("/representation-equilibree/commencer")} variant="secondary">
                Précédent
              </FormButton>
              <FormButton onClick={() => router.push("/representation-equilibree/declarant")}>Modifier</FormButton>
            </FormLayoutButtonGroup>
          </FormLayout>
        </>
      )}
    </ClientOnly>
  );
};

Validation.getLayout = ({ children }) => {
  return <RepresentationEquilibreeLayout title="Validation">{children}</RepresentationEquilibreeLayout>;
};

export default Validation;
