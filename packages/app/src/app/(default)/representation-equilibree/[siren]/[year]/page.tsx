import { authConfig } from "@api/core-domain/infra/auth/config";
import { representationEquilibreeRepo } from "@api/core-domain/repo";
import {
  GetRepresentationEquilibreeBySirenAndYear,
  GetRepresentationEquilibreeBySirenAndYearError,
} from "@api/core-domain/useCases/GetRepresentationEquilibreeBySirenAndYear";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Highlight from "@codegouvfr/react-dsfr/Highlight";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { formatIsoToFr } from "@common/utils/date";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, CenteredContainer, DownloadCard, Grid, GridCol, Link } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { add, isAfter } from "date-fns";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { DetailRepEq } from "../../Recap";
import { EditButton } from "./EditButton";

// Note: [revalidatePath bug](https://github.com/vercel/next.js/issues/49387). Try to reactivate it when it will be fixed in Next (it seems to be fixed in Next 14).
// export const revalidate = 86400; // 24h
export const dynamic = "force-dynamic";

const proconnectManageOrganisationsUrl = process.env.EGAPRO_PROCONNECT_MANAGE_ORGANISATIONS_URL;

const RepEqPage = async ({ params: { siren, year: strYear } }: NextServerPageProps<"siren" | "year">) => {
  const year = +strYear;
  const useCase = new GetRepresentationEquilibreeBySirenAndYear(representationEquilibreeRepo);

  let repEq: RepresentationEquilibreeDTO | null = null;
  try {
    repEq = await useCase.execute({ siren, year: year });
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof GetRepresentationEquilibreeBySirenAndYearError) {
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

  if (repEq === null) {
    return notFound();
  }

  const session = await getServerSession(authConfig);
  const isOwner = session?.user.staff || session?.user.companies.some(company => company.siren === siren);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const olderThanOneYear = session?.data?.user.staff
    ? false
    : repEq.declaredAt === undefined || isAfter(new Date(), add(new Date(repEq.declaredAt), { years: 1 }));

  return (
    <CenteredContainer pb="6w">
      <ClientAnimate>
        {session && !isOwner && !olderThanOneYear && (
          <Alert
            severity="warning"
            as="h2"
            title="Compte non rattaché au Siren"
            closable
            description={
              <>
                Votre compte "<strong>{session.user.email}</strong>" n'est pas rattaché au Siren{" "}
                <strong>{siren}</strong>, vous ne pouvez donc pas modifier cette déclaration.
                <br />
                Si vous pensez qu'il s'agit d'une erreur, vous pouvez faire une demande de rattachement directement
                depuis{" "}
                <Link href={`${proconnectManageOrganisationsUrl}`} target="_blank">
                  votre espace ProConnect
                </Link>
                .
                <br />
                Une fois la demande validée par ProConnect, vous pourez modifier cette déclaration.
              </>
            }
            className={fr.cx("fr-mb-4w")}
          />
        )}
        {isOwner && (
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
        )}
      </ClientAnimate>

      <h1>Récapitulatif {isOwner ? "" : "en accès libre "}de la Représentation Équilibrée</h1>

      <Highlight>
        Déclaration des écarts de représentation Femmes‑Hommes pour l'année <strong>{year + 1}</strong> au titre des
        données <strong>{year}</strong>.
      </Highlight>

      {isOwner && (
        <Box className="text-right" mb="2v">
          <Badge severity="info" noIcon small>
            Déclarée le {formatIsoToFr(repEq.declaredAt)}
          </Badge>{" "}
          <Badge severity="info" noIcon small>
            Modifiée le {formatIsoToFr(repEq.modifiedAt)}
          </Badge>
        </Box>
      )}

      <DetailRepEq repEq={repEq} publicMode={!isOwner} />

      {isOwner && (
        <>
          <EditButton repEq={repEq} />
          <Grid align="center" mt="6w">
            <GridCol md={10} lg={8}>
              <DownloadCard
                title="Télécharger le récapitulatif"
                endDetail="PDF"
                href={`/representation-equilibree/${siren}/${year}/pdf`}
                filename={`representation_${siren}_${year + 1}.pdf`}
                fileType="application/pdf"
                desc={`Année ${year + 1} au titre des données ${year}`}
              />
            </GridCol>
          </Grid>
        </>
      )}
    </CenteredContainer>
  );
};

export default RepEqPage;
