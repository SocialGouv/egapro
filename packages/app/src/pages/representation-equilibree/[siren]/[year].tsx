import { useAutoAnimate } from "@formkit/auto-animate/react";
import { add, isAfter } from "date-fns";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";
import { z } from "zod";
import type { NextPageWithLayout } from "../../_app";
import type { RepresentationEquilibreeAPI } from "@common/models/representation-equilibree";
import {
  motifNonCalculabiliteCadresOptions,
  motifNonCalculabiliteMembresOptions,
} from "@common/models/representation-equilibree";
import { formatIsoToFr } from "@common/utils/date";
import { zodSirenSchema, zodYearSchema } from "@common/utils/form";
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

const schema = z.object({
  siren: zodSirenSchema,
  year: zodYearSchema,
});

const Validation: NextPageWithLayout = () => {
  const { user, loading } = useUser({ redirectTo: "/representation-equilibree/email" });
  const router = useRouter();
  const { siren: sirenQuery, year: yearQuery } = router.query;

  const siren = normalizeQueryParam(sirenQuery);
  const year = normalizeQueryParam(yearQuery);

  const { repeq, error } = useRepresentationEquilibree(siren, Number(year));
  const { config } = useConfig();
  const [globalError, setGlobalError] = useState("");
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  const olderThanOneYear = !repeq?.data.déclaration.date
    ? undefined
    : isAfter(new Date(), add(new Date(repeq.data.déclaration.date), { years: 1 }));

  useEffect(() => {
    // On the first render afer hydration, the query are undefined in Next.js. So we need to wait for the next render to check query params.
    if (sirenQuery !== undefined && yearQuery !== undefined) {
      const checkQueryParams = schema.safeParse({ siren, year });
      if (!checkQueryParams.success) {
        setGlobalError("Les paramètres Siren et année n'ont pas le bon format.");
        return;
      }
    }
    if (!loading && sirenQuery !== undefined) {
      if (!user?.ownership.find(elt => elt === siren) && !user?.staff) {
        setGlobalError("Vous n'êtes pas autorisé pour ce Siren.");
      }
    }
  }, [user, loading, router, sirenQuery, yearQuery, siren, year]);

  const { nafLabelFromCode } = config;

  const formatMotif = (motif: string): string | undefined => {
    const found =
      motifNonCalculabiliteCadresOptions.find(e => e.value === motif) ||
      motifNonCalculabiliteMembresOptions.find(e => e.value === motif);

    return found?.label;
  };
  const { déclarant, entreprise, indicateurs, déclaration } =
    repeq?.data || ({} as Partial<RepresentationEquilibreeAPI["data"]>);

  // TODO : à gérer dans une ErrorBoundary?
  if (globalError)
    return (
      <div ref={animationParent}>
        <Alert type="error" size="sm" mb="4w">
          <AlertTitle>Erreur</AlertTitle>
          <p>{globalError}</p>
        </Alert>
      </div>
    );

  if (!repeq) <p>Aucune répartition équilibrée n'a été trouvée.</p>;

  return (
    <>
      {olderThanOneYear ? (
        <p>
          Cette déclaration a été validée et transmise, et elle n'est plus modifiable car le délai d'un an est écoulé.
        </p>
      ) : (
        <p>
          Vous pouvez modifier cette déclaration et elle remplacera l'actuelle une fois validée et transmise à la
          dernière étape.
        </p>
      )}
      <p>
        Déclaration des écarts de représentation Femmes/Hommes pour l’année {Number(year) + 1} au titre des données{" "}
        {year}.
      </p>
      <RecapSection>
        <RecapSectionTitle>Date de déclaration</RecapSectionTitle>
        <RecapSectionItems>
          <RecapSectionItem>
            <RecapSectionItemContent>{déclaration?.date && formatIsoToFr(déclaration?.date)}</RecapSectionItemContent>
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
              Date de fin de la période de douze mois consécutifs correspondant à l’exercice comptable pour le calcul
              des écarts
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
  );
};

Validation.getLayout = ({ children }) => {
  return (
    <RepresentationEquilibreeLayout title="Validation">
      <ClientOnly>
        <h1>{title}</h1>
        {children}
      </ClientOnly>
    </RepresentationEquilibreeLayout>
  );
};

export default Validation;
