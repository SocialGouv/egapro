import { add, isAfter } from "date-fns";
import { useRouter } from "next/router";
import { z } from "zod";

import type { NextPageWithLayout } from "../../_app";

import { zodSirenSchema, zodYearSchema } from "@common/utils/form";
import { AuthenticatedOnly } from "@components/AuthenticatedOnly";
import { ClientOnly } from "@components/ClientOnly";
import { OwnersOnly } from "@components/OwnersOnly";
import { ParamsChecker } from "@components/ParamsChecker";
import { DetailRepresentationEquilibree } from "@components/RepresentationEquilibree";
import { RepresentationEquilibreeLayout } from "@components/layouts/RepresentationEquilibreeLayout";
import { FormButton, FormLayout, FormLayoutButtonGroup } from "@design-system";
import { useRepresentationEquilibree } from "@services/apiClient";

const title = "Récapitulatif de la Représentation Équilibrée";

// In this component, we are sure that siren and year are not undefined and also correct after zod validation.
const RepresentationEquilibreeWithNavigation = ({ siren, year }: { siren: string; year: number }) => {
  const router = useRouter();
  const { repeq, error } = useRepresentationEquilibree(siren, year);

  const olderThanOneYear = !repeq?.data.déclaration.date
    ? undefined
    : isAfter(new Date(), add(new Date(repeq.data.déclaration.date), { years: 1 }));

  // Todo: ajouter Suspense
  if (!repeq?.data || olderThanOneYear === undefined) return <p>Chargement...</p>;

  if (error) <p>Une erreur a été rencontrée par l'API.</p>;

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
      <DetailRepresentationEquilibree data={repeq?.data} />
      <FormLayout>
        <FormLayoutButtonGroup>
          <FormButton onClick={() => router.push("/representation-equilibree/commencer")} variant="secondary">
            Précédent
          </FormButton>
          <FormButton onClick={() => router.push("/representation-equilibree/declarant")} disabled={olderThanOneYear}>
            Modifier
          </FormButton>
        </FormLayoutButtonGroup>
      </FormLayout>
    </>
  );
};

const schemaParams = z.object({
  siren: zodSirenSchema,
  year: zodYearSchema,
});

const RecapitulatifPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { siren: sirenQuery, year: yearQuery } = router.query;

  // It is safe to cast as string as we prevent invalid params with ParamsChecker boundary.
  const siren = sirenQuery as string;
  const year = Number(yearQuery as string);

  return (
    <ClientOnly>
      <h1>{title}</h1>
      <AuthenticatedOnly>
        <ParamsChecker schema={schemaParams}>
          <OwnersOnly siren={siren}>
            <RepresentationEquilibreeWithNavigation siren={siren} year={year} />
          </OwnersOnly>
        </ParamsChecker>
      </AuthenticatedOnly>
    </ClientOnly>
  );
};

RecapitulatifPage.getLayout = ({ children }) => {
  return <RepresentationEquilibreeLayout title="Validation">{children}</RepresentationEquilibreeLayout>;
};

export default RecapitulatifPage;
