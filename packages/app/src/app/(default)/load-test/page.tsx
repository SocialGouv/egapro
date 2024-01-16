import Alert from "@codegouvfr/react-dsfr/Alert";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { type DeclarationOpmcDTO } from "@common/core-domain/dtos/DeclarationOpmcDTO";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { type NextServerPageProps } from "@common/utils/next";
import { Box, Heading } from "@design-system";
import { MessageProvider } from "@design-system/client";

import {
  getAllDeclarationOpmcSirenAndYear,
  getAllDeclarationsBySiren,
  getAllRepresentationEquilibreeBySiren,
} from "../mon-espace/actions";
import { IndexList } from "./IndexList";
import { RepeqList } from "./RepeqList";

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

const LoadTestPage = async ({ searchParams }: NextServerPageProps<never, { key: string; siren: string }>) => {
  try {
    if (!searchParams || !searchParams.siren || !searchParams.key) throw new Error("Missing search params");
    if (searchParams.key !== "egapro-load-test") throw new Error("Invalid key");
  } catch (e) {
    throw new Error("Load test error");
  }

  const selectedSiren = searchParams.siren;

  let declarations: DeclarationDTO[] = [];
  let repEq: RepresentationEquilibreeDTO[] = [];
  const declarationOpmcList: DeclarationOpmcDTO[] = [];

  if (selectedSiren) {
    declarations = await getAllDeclarationsBySiren(selectedSiren);
    repEq = await getAllRepresentationEquilibreeBySiren(selectedSiren);

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
      <Heading as="h1" text="Load Testing" />
      <Alert severity="info" small description={<InfoText />} />
      <Box mt="10w">
        <IndexList declarations={declarations} declarationOpmcList={declarationOpmcList} />
      </Box>
      <Box mt="10w" mb="8w">
        <RepeqList representationEquilibrees={repEq} />
      </Box>
    </MessageProvider>
  );
};

export default LoadTestPage;
