import { authConfig } from "@api/core-domain/infra/auth/config";
import { type NextServerPageProps } from "@common/utils/next";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { DownloadCard, Grid, GridCol } from "@design-system";
import { notFound } from "next/navigation";
import { getServerSession, type Session } from "next-auth";

import { getDeclaration } from "../../actions";
import { EditButton } from "./EditButton";
import { RecapDeclaration } from "./RecapDeclaration";

const canEditSiren = (user?: Session["user"]) => (siren?: string) => {
  if (!siren || !user) return undefined;
  return user.staff || user.companies.some(company => company.siren === siren);
};

const RecapPage = async ({ params: { siren, year: strYear } }: NextServerPageProps<"siren" | "year">) => {
  const year = Number(strYear);

  const déclaration = await getDeclaration(siren, year);

  // TODO gestion des erreurs de l'action dans un error.tsx ?

  // const useCase = new GetDeclarationBySirenAndYear(declarationRepo);

  // let déclaration: DeclarationDTO | null = null;

  // try {
  //   déclaration = await useCase.execute({ siren, year });
  // } catch (error: unknown) {
  //   console.error(error);

  //   if (error instanceof GetDeclarationBySirenAndYearError) {
  //     return (
  //       <CenteredContainer pb="6w">
  //         <Alert severity="error" title="Erreur" description={error.message} />
  //       </CenteredContainer>
  //     );
  //   }

  //   return (
  //     <CenteredContainer pb="6w">
  //       <Alert severity="error" title="Erreur inattendue" description="Une erreur inattendue est survenue." />
  //     </CenteredContainer>
  //   );
  // }

  if (déclaration === null) {
    notFound();
  }

  const session = await getServerSession(authConfig);

  const declarationDate = déclaration.déclaration.date;

  const canEdit = canEditSiren(session?.user)(siren);

  if (!declarationDate) return <SkeletonForm fields={8} />;

  return (
    <>
      <RecapDeclaration déclaration={déclaration} />

      {canEdit && year && (
        <>
          <EditButton déclaration={déclaration} />

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

export default RecapPage;
