"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, DownloadCard, Grid, GridCol } from "@design-system";
import { useDeclaration } from "@services/apiClient/declaration";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { add, isAfter } from "date-fns";
import { useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { useSession } from "next-auth/react";

import { funnelConfig, type FunnelKey } from "../declarationFunnelConfiguration";
import { RecapDeclaration } from "./RecapDeclaration";

const stepName: FunnelKey = "declaration-existante";

const canEditSiren = (user?: Session["user"]) => (siren?: string) => {
  if (!siren || !user) return undefined;
  return user.staff || user.companies.some(company => company.siren === siren);
};

const Page = () => {
  const session = useSession();
  const router = useRouter();
  const { formData, setStatus } = useDeclarationFormManager();

  const siren = formData.commencer?.entrepriseDéclarante?.siren;
  const year = formData.commencer?.annéeIndicateurs;

  const { declaration, error } = useDeclaration(siren, year);

  const canEdit = canEditSiren(session?.data?.user)(siren);

  const olderThanOneYear = !declaration?.data.déclaration.date
    ? undefined
    : isAfter(new Date(), add(new Date(declaration.data.déclaration.date), { years: 1 }));

  if (!declaration?.data || olderThanOneYear === undefined) return <SkeletonForm fields={8} />;

  if (error) <p>{"Une erreur a été rencontrée par l'API."}</p>;

  return (
    <>
      {olderThanOneYear ? (
        <p>
          Cette déclaration a été validée et transmise, et elle n'est plus modifiable car le délai d'un an est écoulé.
        </p>
      ) : (
        <Alert
          severity="info"
          title="Cette déclaration a été validée et transmise."
          description="Vous pouvez la modifier, une fois validée et transmise, elle remplacera la déclaration actuelle."
        />
      )}

      <RecapDeclaration déclaration={declaration?.data} />

      {canEdit && year && (
        <>
          <BackNextButtonsGroup
            className={fr.cx("fr-my-8w")}
            backProps={{
              onClick: () => router.push(funnelConfig(formData)[stepName].previous().url),
            }}
            nextLabel="Modifier"
            nextProps={{
              onClick: () => {
                setStatus("edition");
                router.push(funnelConfig(formData)[stepName].next().url);
              },
            }}
          />

          <Grid align="center" mb="6w">
            <GridCol md={10} lg={8}>
              <DownloadCard
                title="Télécharger le récapitulatif"
                endDetail="PDF"
                href={`/api/declaration/${siren}/${year}/pdf`}
                filename={`declaration_egapro_${siren}_${year + 1}.pdf`}
                fileType="application/pdf"
                desc={`Année ${year + 1} au titre des données ${year}`}
              />
            </GridCol>
          </Grid>
        </>
      )}
    </>
  );
};

export default Page;
