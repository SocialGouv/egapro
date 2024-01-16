"use client";

import Table from "@codegouvfr/react-dsfr/Table";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { type DeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { type DeclarationOpmcDTO } from "@common/core-domain/dtos/DeclarationOpmcDTO";
import { formatIsoToFr } from "@common/utils/date";
import { Heading, Link } from "@design-system";
import { isBefore, sub } from "date-fns";
import { capitalize, upperCase } from "lodash";

import { buildHelpersObjectifsMesures } from "../index-egapro/objectifs-mesures/[siren]/[year]/ObjectifsMesuresForm";

//Note: For 2022, first year of OPMC, we consider that the duration to be frozen is 2 years, but for next years, it will be 1 year like isFrozenDeclaration.
const OPMC_FROZEN_DURATION = { years: 2 };

const isFrozenDeclarationForOPMC = (declaration: DeclarationOpmcDTO) =>
  declaration?.["declaration-existante"]?.date
    ? isBefore(new Date(declaration?.["declaration-existante"]?.date), sub(new Date(), OPMC_FROZEN_DURATION))
    : false;

enum declarationOpmcStatus {
  ALREADY_FILLED = "Déjà renseignés",
  COMPLETED = "Renseignés",
  INDEX_OVER_85 = "Index supérieur à 85",
  NOT_APPLICABLE = "Non applicable",
  NOT_MODIFIABLE = "Déclaration non modifiable",
  NOT_MODIFIABLE_CORRECT = "Déclaration non modifiable sur données correctes",
  NOT_MODIFIABLE_INCORRECT = "Déclaration non modifiable sur données incorrectes",
  TO_COMPLETE = "À renseigner",
  YEAR_NOT_APPLICABLE = "Année non applicable",
}

const getDeclarationOpmcStatus = (declaration?: DeclarationOpmcDTO) => {
  if (!declaration) return declarationOpmcStatus.NOT_APPLICABLE;
  const { after2021, index, initialValuesObjectifsMesures, objectifsMesuresSchema } =
    buildHelpersObjectifsMesures(declaration);

  if (!declaration["resultat-global"] || index === undefined) return declarationOpmcStatus.NOT_APPLICABLE;
  if (!after2021) return declarationOpmcStatus.YEAR_NOT_APPLICABLE;
  if (index >= 85) return declarationOpmcStatus.INDEX_OVER_85;

  try {
    objectifsMesuresSchema.parse(initialValuesObjectifsMesures);
    if (isFrozenDeclarationForOPMC(declaration)) return declarationOpmcStatus.NOT_MODIFIABLE_CORRECT;
  } catch (e) {
    if (isFrozenDeclarationForOPMC(declaration)) return declarationOpmcStatus.NOT_MODIFIABLE_INCORRECT;
    return declarationOpmcStatus.TO_COMPLETE;
  }
  return declarationOpmcStatus.COMPLETED;
};

const formatDeclarationOpmcStatus = (status: declarationOpmcStatus, siren: string, year: number) => {
  const withLink = (text: string) => (
    <Link key={`${siren}-objectifs-mesures`} href={`/index-egapro/objectifs-mesures/${siren}/${year}`}>
      {text}
    </Link>
  );

  switch (status) {
    case declarationOpmcStatus.COMPLETED:
      return withLink(declarationOpmcStatus.COMPLETED);
    case declarationOpmcStatus.INDEX_OVER_85:
      return declarationOpmcStatus.INDEX_OVER_85;
    case declarationOpmcStatus.NOT_APPLICABLE:
      return declarationOpmcStatus.NOT_APPLICABLE;
    case declarationOpmcStatus.NOT_MODIFIABLE_CORRECT:
      return withLink(declarationOpmcStatus.ALREADY_FILLED);
    case declarationOpmcStatus.NOT_MODIFIABLE_INCORRECT:
      return withLink(declarationOpmcStatus.NOT_MODIFIABLE);
    case declarationOpmcStatus.TO_COMPLETE:
      return withLink(declarationOpmcStatus.TO_COMPLETE);
    case declarationOpmcStatus.YEAR_NOT_APPLICABLE:
      return declarationOpmcStatus.YEAR_NOT_APPLICABLE;
    default:
      return declarationOpmcStatus.NOT_APPLICABLE;
  }
};

const formatTableData = (declarations: DeclarationDTO[], declarationOpmcList: DeclarationOpmcDTO[]) =>
  declarations.map(declaration => {
    const rowYear = declaration.commencer?.annéeIndicateurs;
    const rowSiren = declaration.commencer?.siren;
    return [
      <Link key={declaration.commencer?.siren} href={`/index-egapro/declaration/${rowSiren}/${rowYear}`}>
        {declaration.commencer?.siren}
      </Link>,
      rowYear,
      declaration.entreprise?.type === "ues"
        ? upperCase(declaration.entreprise?.type)
        : capitalize(declaration.entreprise?.type),
      declaration.entreprise?.tranche ? CompanyWorkforceRange.Label[declaration.entreprise.tranche] : undefined,
      formatIsoToFr(declaration["declaration-existante"].date || ""),
      declaration["resultat-global"]?.index || <span title="Non calculable">NC</span>,
      formatDeclarationOpmcStatus(
        getDeclarationOpmcStatus(
          declarationOpmcList.find(declarationOpmc => declarationOpmc.commencer?.annéeIndicateurs === rowYear),
        ),
        rowSiren || "",
        rowYear || 0,
      ),
      <Link
        key={`${rowSiren}-pdf`}
        href={`/index-egapro/declaration/${rowSiren}/${rowYear}/pdf`}
        download={`declaration_egapro_${rowSiren}_${Number(rowYear) + 1}.pdf`}
      >
        Télécharger
      </Link>,
    ];
  });

export const IndexList = ({
  declarations,
  declarationOpmcList,
}: {
  declarationOpmcList: DeclarationOpmcDTO[];
  declarations: DeclarationDTO[];
}) => {
  const headers = [
    "SIREN",
    "ANNÉE INDICATEUR",
    "STRUCTURE",
    "TRANCHE D'EFFECTIF",
    "DATE DE DÉCLARATION",
    "INDEX",
    "OBJECTIFS ET MESURES",
    "RÉCAPITULATIF",
  ];

  return (
    <div>
      <Heading as="h1" variant="h5" text="Liste des déclarations transmises - Index Égalité Professionnelle" />
      {(declarations.length > 0 && (
        <Table headers={headers} data={formatTableData(declarations, declarationOpmcList)} />
      )) || <p>Aucune déclaration transmise.</p>}
    </div>
  );
};
