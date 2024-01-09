import { authConfig } from "@api/core-domain/infra/auth/config";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type DeclarationOpmcDTO } from "@common/core-domain/dtos/DeclarationOpmcDTO";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Heading } from "@design-system";
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
  </>
);

const MesDeclarationsPage = async ({ searchParams }: NextServerPageProps<never, "siren">) => {
  const session = await getServerSession(authConfig);
  if (!session) redirect("/login");
  const isStaff = session?.user?.staff || session?.staff?.impersonating || false;
  const isImpersonating = session?.staff?.impersonating || false;
  const sirenList = (session?.user.companies || []).map(company => company.siren);
  const selectedSiren = searchParams && typeof searchParams.siren === "string" ? searchParams.siren : "";
  const titleText = isStaff && !isImpersonating ? "Les déclarations" : "Mes déclarations";

  if (selectedSiren === "" && isStaff && !isImpersonating) {
    return (
      <MessageProvider>
        <Heading as="h1" text={titleText} />
        <Alert severity="info" small description={<InfoText />} />
        <Box mt="2w">
          <SelectSirenStaff currentSiren={selectedSiren} />
        </Box>
      </MessageProvider>
    );
  }

  try {
    const declarations = await getAllDeclarationsBySiren(isImpersonating ? sirenList[0] : selectedSiren);
    const repEq = await getAllRepresentationEquilibreeBySiren(isImpersonating ? sirenList[0] : selectedSiren);
    const sirenWithCompanyName: Array<{ companyName: string; siren: string }> = [];
    for (const siren of sirenList) {
      const result = await getCompany(siren);
      if (result.ok) {
        sirenWithCompanyName.push({ siren, companyName: result.data?.simpleLabel || "" });
      }
    }

    const declarationOpmcList: DeclarationOpmcDTO[] = [];
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

    return (
      <MessageProvider>
        <Heading as="h1" text={titleText} />
        <Alert severity="info" small description={<InfoText />} />
        <Box mt="2w">
          {(isStaff && !isImpersonating && <SelectSirenStaff currentSiren={selectedSiren} />) || (
            <SelectSiren sirenListWithCompanyName={sirenWithCompanyName} currentSiren={selectedSiren} />
          )}
        </Box>
        <Box mt="10w">
          <IndexList declarations={declarations} declarationOpmcList={declarationOpmcList} />
        </Box>
        <Box mt="10w">
          <RepeqList representationEquilibrees={repEq} />
        </Box>
      </MessageProvider>
    );
  } catch {
    return null;
  }
};

export default MesDeclarationsPage;
