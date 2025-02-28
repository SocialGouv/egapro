import { authConfig } from "@api/core-domain/infra/auth/config";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { type DeclarationOpmcDTO } from "@common/core-domain/dtos/DeclarationOpmcDTO";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Heading, Link } from "@design-system";
import { MessageProvider } from "@design-system/client";
import { getCompany } from "@globalActions/company";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import {
  getAllDeclarationOpmcSirenAndYear,
  getAllDeclarationsBySiren,
  getAllRepresentationEquilibreeBySiren,
} from "../actions";
import { IndexList } from "./IndexList";
import { RepeqList } from "./RepeqList";
import { SelectSiren } from "./SelectSiren";
import { SelectSirenStaff } from "./SelectSirenStaff";

const proconnectDiscoveryUrl = process.env.EGAPRO_PROCONNECT_DISCOVERY_URL;

const InfoText = () => (
  <>
    <p>
      Dans ce menu, vous avez accès à la liste des déclarations de l’index de l’égalité professionnelle et, si vous êtes
      assujetti, de la représentation équilibrée qui ont été transmises à l’administration, en sélectionnant au
      préalable dans la liste déroulante le numéro Siren de l'entreprise (ou de l’entreprise ayant déclaré l'index pour
      le compte de l’unité économique et sociale) concernée si vous gérez plusieurs entreprises.
    </p>
    <br />
    <p>
      Vous pouvez ainsi télécharger le récapitulatif de la déclaration à la colonne « <b>RÉCAPITULATIF</b> », et en
      cliquant sur le Siren, vous accédez à la déclaration transmise. A la colonne « <b>OBJECTIFS ET MESURES</b> », vous
      avez accès à la déclaration des mesures de correction lorsque l’index est inférieur à 75 points et des objectifs
      de progression lorsque l’index est inférieur à 85 points.
    </p>
    <p>
      <br />
      Vous souhaitez rattacher votre adresse email à une autre entreprise,{" "}
      <Link target="_blank" href={`${proconnectDiscoveryUrl}/manage-organizations`}>
        cliquez ici
      </Link>
    </p>
  </>
);

const checkSirenToGet = (isImpersonating: boolean, sirenList: string[], selectedSiren: string) => {
  if (isImpersonating && sirenList.length > 0) return sirenList[0];
  return selectedSiren || sirenList[0] || null;
};

const MesDeclarationsPage = async ({ searchParams }: NextServerPageProps<never, "siren">) => {
  const session = await getServerSession(authConfig);
  if (!session) redirect("/login");

  const isStaff = session?.user?.staff || false;
  const isImpersonating = session?.staff?.impersonating || false;

  const sirenList = (session?.user.companies || []).map(company => company.siren);
  const selectedSiren = searchParams && typeof searchParams.siren === "string" ? searchParams.siren : "";
  const sirenToGet = checkSirenToGet(isImpersonating, sirenList, selectedSiren);

  const titleText = isStaff && !isImpersonating ? "Les déclarations" : "Mes déclarations";

  let declarations: DeclarationDTO[] = [];
  let repEq: RepresentationEquilibreeDTO[] = [];
  const sirenWithCompanyName: Array<{ companyName: string; siren: string }> = [];
  const declarationOpmcList: DeclarationOpmcDTO[] = [];

  if (selectedSiren === "" && isStaff && !isImpersonating) {
    return (
      <MessageProvider>
        <Heading as="h1" text={titleText} />
        <Alert severity="info" small description={<InfoText />} />
        <Box mt="2w" mb="8w">
          <SelectSirenStaff currentSiren={selectedSiren} />
        </Box>
      </MessageProvider>
    );
  }

  if (sirenToGet) {
    declarations = await getAllDeclarationsBySiren(sirenToGet);
    repEq = await getAllRepresentationEquilibreeBySiren(sirenToGet);
    declarations.sort((a, b) => (b.commencer?.annéeIndicateurs || 0) - (a.commencer?.annéeIndicateurs || 0));
    repEq.sort((a, b) => (b.year || 0) - (a.year || 0));
    for (const siren of sirenList) {
      const result = await getCompany(siren);
      if (result.ok) {
        sirenWithCompanyName.push({ siren, companyName: result.data?.simpleLabel || "" });
      }
    }
    for (const declaration of declarations) {
      if (declaration.commencer?.annéeIndicateurs) {
        const result = await getAllDeclarationOpmcSirenAndYear(
          declaration.commencer?.siren || "",
          declaration.commencer?.annéeIndicateurs || 0,
        );
        if (result) {
          declarationOpmcList.push(result);
        }
      }
    }
  }

  return (
    <MessageProvider>
      <Heading as="h1" text={titleText} />
      <Alert severity="info" small description={<InfoText />} />
      <Box mt="2w">
        {(isStaff && !isImpersonating && <SelectSirenStaff currentSiren={selectedSiren} />) ||
          (sirenWithCompanyName.length > 0 && (
            <SelectSiren sirenListWithCompanyName={sirenWithCompanyName} currentSiren={selectedSiren} />
          ))}
      </Box>
      <Box mt="10w">
        <IndexList declarations={declarations} declarationOpmcList={declarationOpmcList} />
      </Box>
      <Box mt="10w" mb="8w">
        <RepeqList representationEquilibrees={repEq} />
      </Box>
    </MessageProvider>
  );
};

export default MesDeclarationsPage;
