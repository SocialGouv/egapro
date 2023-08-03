"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, DownloadCard, Grid, GridCol } from "@design-system";
import { useDeclaration } from "@services/apiClient/declaration";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
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

  const siren = formData.commencer?.siren;
  const annéeIndicateurs = formData.commencer?.annéeIndicateurs;

  const { declaration, error } = useDeclaration(siren, annéeIndicateurs);

  const canEdit = canEditSiren(session?.data?.user)(siren);

  if (!declaration?.data) return <SkeletonForm fields={8} />;

  if (error) <p>{"Une erreur a été rencontrée par l'API."}</p>;

  return (
    <>
      <RecapDeclaration déclaration={declaration?.data} />

      {canEdit && annéeIndicateurs && (
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
                href={`/api/declaration/${siren}/${annéeIndicateurs}/pdf`}
                filename={`declaration_egapro_${siren}_${annéeIndicateurs + 1}.pdf`}
                fileType="application/pdf"
                desc={`Année ${annéeIndicateurs + 1} au titre des données ${annéeIndicateurs}`}
              />
            </GridCol>
          </Grid>
        </>
      )}
    </>
  );
};

export default Page;
