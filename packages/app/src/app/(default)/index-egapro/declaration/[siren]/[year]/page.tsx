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
import { add, isAfter } from "date-fns";
import { notFound } from "next/navigation";
import { getServerSession, type Session } from "next-auth";

import { getDeclaration } from "../../actions";
import { EditButton } from "./EditButton";
import { RecapDeclaration } from "./RecapDeclaration";

const canEditSiren = (user?: Session["user"]) => (siren?: string) => {
  if (!siren || !user) return undefined;
  return user.staff || user.companies.some(company => company.siren === siren);
};

// Note: [revalidatePath bug](https://github.com/vercel/next.js/issues/49387). Try to reactivate it when it will be fixed in Next (it seems to be fixed in Next 14).
// export const revalidate = 86400; // 24h
export const dynamic = "force-dynamic";
// export const revalidate = 86_400; // 24h

const RecapPage = async ({ params: { siren, year: strYear } }: NextServerPageProps<"siren" | "year">) => {
  const year = Number(strYear);

  let déclaration: DeclarationDTO | null = null;
  try {
    déclaration = await getDeclaration(siren, year);
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
  const olderThanOneYear = isAfter(new Date(), add(new Date(declarationDate), { years: 1 }));

  return (
    <>
      <Alert
        severity="info"
        as="h2"
        title="Cette déclaration a été validée et transmise."
        description={
          olderThanOneYear
            ? "Elle n'est plus modifiable car le délai d'un an est écoulé"
            : "Vous pouvez la modifier, une fois validée et transmise, elle remplacera la déclaration actuelle"
        }
        className={fr.cx("fr-mb-4w")}
      />
      <RecapDeclaration déclaration={déclaration} />

      {canEdit && year && (
        <>
          <EditButton déclaration={déclaration} />

          <Grid align="center" mb="6w">
            <GridCol md={10} lg={8}>
              <DownloadCard
                title="Télécharger le récapitulatif"
                endDetail="PDF"
                href={`/index-egapro/declaration/${siren}/${year}/pdf`}
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
