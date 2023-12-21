import Table from "@codegouvfr/react-dsfr/Table";
import { type RepresentationEquilibreeDTO } from "@common/core-domain/dtos/RepresentationEquilibreeDTO";
import { formatIsoToFr } from "@common/utils/date";
import { Heading, Link } from "@design-system";

const getPercent = (
  filterReasonKey: string,
  percentKey: string,
  representationEquilibree: RepresentationEquilibreeDTO,
) =>
  (!(filterReasonKey in representationEquilibree) &&
    representationEquilibree[percentKey as keyof RepresentationEquilibreeDTO]?.toString()) ||
  "NC";

const formatTableData = (representationEquilibrees: RepresentationEquilibreeDTO[]) =>
  representationEquilibrees.map(representationEquilibree => [
    <Link
      key={representationEquilibree.siren}
      href={`/representation-equilibree/${representationEquilibree.siren}/${representationEquilibree.year}`}
    >
      {representationEquilibree.siren}
    </Link>,
    representationEquilibree.year,
    formatIsoToFr(representationEquilibree.declaredAt),
    getPercent("notComputableReasonExecutives", "executiveWomenPercent", representationEquilibree),
    getPercent("notComputableReasonExecutives", "executiveMenPercent", representationEquilibree),
    getPercent("notComputableReasonMembers", "memberWomenPercent", representationEquilibree),
    getPercent("notComputableReasonMembers", "memberMenPercent", representationEquilibree),
    <Link
      key={`${representationEquilibree.siren}-pdf`}
      href={`/representation-equilibree/${representationEquilibree.siren}/${representationEquilibree.year}/pdf`}
      download={`declaration_egapro_${representationEquilibree.siren}_${Number(representationEquilibree.year) + 1}.pdf`}
    >
      Télécharger
    </Link>,
  ]);

export const RepeqList = ({
  representationEquilibrees,
}: {
  representationEquilibrees: RepresentationEquilibreeDTO[];
}) => {
  const headers = [
    "SIREN",
    "ANNÉE ÉCARTS",
    "DATE DE DÉCLARATION",
    "% FEMMES CADRES",
    "% HOMMES CADRES",
    "% FEMMES MEMBRES",
    "% HOMMES MEMBRES",
    "RÉCAPITULATIF",
  ];

  return (
    <div>
      <Heading as="h1" variant="h5" text="Liste des déclarations transmises - Représentation Équilibrée" />
      <Table headers={headers} data={formatTableData(representationEquilibrees)}></Table>
    </div>
  );
};
