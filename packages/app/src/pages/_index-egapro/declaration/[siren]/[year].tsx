import { config } from "@common/config";
import { zodSirenSchema, zodYearSchema } from "@common/utils/form";
import { DeclarationSummary } from "@components/DeclarationSummary";
import { DeclarationLayout } from "@components/layouts/DeclarationLayout";
import { OwnersOnly } from "@components/OwnersOnly";
import { ParamsChecker } from "@components/ParamsChecker";
import { FeatureStatusProvider } from "@components/rdsfr/FeatureStatusProvider";
import {
  Alert,
  AlertTitle,
  Card,
  CardBody,
  CardBodyContent,
  CardBodyContentDescription,
  CardBodyContentDetails,
  CardBodyContentEnd,
  CardBodyContentTitle,
  FormButton,
  FormLayout,
  FormLayoutButtonGroup,
  Grid,
  GridCol,
} from "@design-system";
import { useDeclaration } from "@services/apiClient/declaration";
import { add, isAfter } from "date-fns";
import { useRouter } from "next/router";
import { z } from "zod";

import type { NextPageWithLayout } from "../../../_app";

const title = "Récapitulatif de la déclaration d'index egapro";

// TODO: placeholder inspiré de la repeq. À migrer React DSFR et compléter

// In this component, we are sure that siren and year are not undefined and also correct after zod validation.
const DeclarationWithNavigation = ({ siren, year }: { siren: string; year: number }) => {
  const router = useRouter();
  const { declaration, error } = useDeclaration(siren, year);

  const olderThanOneYear = !declaration?.data.déclaration.date
    ? undefined
    : isAfter(new Date(), add(new Date(declaration.data.déclaration.date), { years: 1 }));

  if (!declaration?.data || olderThanOneYear === undefined) return <p>Chargement...</p>;

  if (error) <p>Une erreur a été rencontrée par l'API.</p>;

  return (
    <>
      {olderThanOneYear ? (
        <p>
          Cette déclaration a été validée et transmise, et elle n'est plus modifiable car le délai d'un an est écoulé.
        </p>
      ) : (
        <Alert mb="4w">
          <AlertTitle as="h2">Cette déclaration a été validée et transmise.</AlertTitle>
          <p>Vous pouvez la modifier, une fois validée et transmise, elle remplacera la déclaration actuelle</p>
        </Alert>
      )}
      <DeclarationSummary data={declaration?.data} />
      <FormLayout>
        <FormLayoutButtonGroup>
          <FormButton onClick={() => router.push("/_index-egapro/declaration/commencer")} variant="secondary">
            Précédent
          </FormButton>
          {!olderThanOneYear && (
            <FormButton onClick={() => router.push("/_index-egapro/declaration/declarant")} disabled={olderThanOneYear}>
              Modifier
            </FormButton>
          )}
        </FormLayoutButtonGroup>
      </FormLayout>

      <Grid mt="6w" justifyCenter>
        <GridCol md={10} lg={8}>
          <Card size="sm" isEnlargeLink>
            <CardBody>
              <CardBodyContent>
                <CardBodyContentTitle>
                  <a href={`${config.api_url}/declaration/${siren}/${year}/pdf`}>Télécharger le récapitulatif</a>
                </CardBodyContentTitle>
                <CardBodyContentDescription>
                  Année {year + 1} au titre des données {year}.
                </CardBodyContentDescription>
                <CardBodyContentEnd>
                  <CardBodyContentDetails>PDF</CardBodyContentDetails>
                </CardBodyContentEnd>
              </CardBodyContent>
            </CardBody>
          </Card>
        </GridCol>
      </Grid>
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
    <>
      <h1>{title}</h1>
      <ParamsChecker schema={schemaParams}>
        <OwnersOnly siren={siren}>
          <DeclarationWithNavigation siren={siren} year={year} />
        </OwnersOnly>
      </ParamsChecker>
    </>
  );
};

RecapitulatifPage.getLayout = ({ children }) => (
  <DeclarationLayout title={title} authenticated>
    <FeatureStatusProvider>{children}</FeatureStatusProvider>
  </DeclarationLayout>
);

export default RecapitulatifPage;
