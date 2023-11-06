import { authConfig } from "@api/core-domain/infra/auth/config";
import { GetDeclarationBySirenAndYearError } from "@api/core-domain/useCases/GetDeclarationBySirenAndYear";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { UnexpectedSessionError } from "@common/shared-domain";
import { type NextServerPageProps } from "@common/utils/next";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { CenteredContainer, DownloadCard, Grid, GridCol } from "@design-system";
import { notFound } from "next/navigation";
import { getServerSession, type Session } from "next-auth";

import { getDeclaration } from "../../actions";
import { EditButton } from "./EditButton";
import { RecapDeclaration } from "./RecapDeclaration";

const canEditSiren = (user?: Session["user"]) => (siren?: string) => {
  if (!siren || !user) return undefined;
  return user.staff || user.companies.some(company => company.siren === siren);
};

export const revalidate = 86_400; // 24h

const RecapPage = async ({ params: { siren, year: strYear } }: NextServerPageProps<"siren" | "year">) => {
  const year = Number(strYear);

  let déclaration: DeclarationDTO | null = null;
  try {
    déclaration = await getDeclaration(siren, year);
    if (déclaration) déclaration["declaration-existante"].status = "consultation";
  } catch (error: unknown) {
    console.error("Error: ", error);

    if (error instanceof UnexpectedSessionError) {
      return (
        <Alert
          severity="error"
          title="Erreur"
          description={
            <>
              Vous n'êtes pas authentifié. Veuillez vous connecter à nouveau.
              <br />
              <Button
                linkProps={{ href: `/login` }}
                iconId="fr-icon-arrow-right-line"
                iconPosition="right"
                className={fr.cx("fr-mt-2w")}
                priority="secondary"
              >
                Se connecter
              </Button>
            </>
          }
        />
      );
    }

    if (error instanceof GetDeclarationBySirenAndYearError) {
      return (
        <CenteredContainer pb="6w">
          <Alert severity="error" title="Erreur" description={error.message} />
        </CenteredContainer>
      );
    }

    return (
      <CenteredContainer pb="6w">
        <Alert severity="error" title="Erreur inattendue" description="Une erreur inattendue est survenue." />
      </CenteredContainer>
    );
  }

  if (déclaration === null) {
    notFound();
  }

  const session = await getServerSession(authConfig);

  const declarationDate = déclaration["declaration-existante"].date;

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
