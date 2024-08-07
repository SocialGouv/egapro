import { authConfig } from "@api/core-domain/infra/auth/config";
import { GetDeclarationBySirenAndYearError } from "@api/core-domain/useCases/GetDeclarationBySirenAndYear";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { type DeclarationOpmcDTO } from "@common/core-domain/dtos/DeclarationOpmcDTO";
import { UnexpectedSessionError } from "@common/shared-domain";
import { type NextServerPageProps } from "@common/utils/next";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { CenteredContainer } from "@design-system";
import { MessageProvider } from "@design-system/client";
import { notFound, redirect } from "next/navigation";
import { getServerSession, type Session } from "next-auth";

import { getDeclarationOpmc } from "../../actions";
import { ObjectifsMesuresForm } from "./ObjectifsMesuresForm";

const canEditSiren = (user?: Session["user"]) => (siren?: string) => {
  if (!siren || !user) return undefined;
  return user.staff || user.companies.some(company => company.siren === siren);
};

const ObjectifsMesuresPage = async ({ params: { siren, year: strYear } }: NextServerPageProps<"siren" | "year">) => {
  const year = Number(strYear);
  const session = await getServerSession(authConfig);
  if (!session) redirect("/login");

  let declaration: DeclarationOpmcDTO | null = null;
  try {
    declaration = await getDeclarationOpmc(siren, year);
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

  if (declaration === null) {
    notFound();
  }

  const index = declaration["resultat-global"]?.index;
  const declarationDate = declaration["declaration-existante"].date;
  const canEdit = canEditSiren(session?.user)(siren);

  if (!canEdit) return <p>Vous n'êtes pas autorisés à consulter cette déclaration.</p>;

  if (!declarationDate) return <SkeletonForm fields={8} />;

  if (declaration["periode-reference"]?.périodeSuffisante !== "oui")
    return <p>Vous n'avez pas à remplir cette page car l'entreprise n'a pas au moins 12 mois d'existence.</p>;

  if (index === undefined)
    return <p>Vous n'avez pas à remplir cette page car l'index est non calculable pour cette déclaration.</p>;

  if (index > 85)
    return <p>Vous n'avez pas à remplir cette page car l'index de cette déclaration est supérieur à 85.</p>;

  return (
    <MessageProvider>
      <ObjectifsMesuresForm declaration={declaration} isStaff={session.user.staff} />
    </MessageProvider>
  );
};

export default ObjectifsMesuresPage;
