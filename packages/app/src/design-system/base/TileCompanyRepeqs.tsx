import { useState } from "react";
import {
  TileCompany,
  TileCompanyLoadMore,
  TileCompanyLocation,
  TileCompanyPercent,
  TileCompanyPercentData,
  TileCompanySiren,
  TileCompanyTable,
  TileCompanyTableBody,
  TileCompanyTableBodyRow,
  TileCompanyTableBodyRowCol,
  TileCompanyTableHead,
  TileCompanyTableHeadCol,
  TileCompanyTitle,
  TileCompanyYear,
} from "./TileCompany";
import type { RepeqType } from "@services/apiClient/useSearchRepeqs";

export type data = { men?: number; women?: number };

export type TileCompanyRepeqsProps = {
  data: Array<{
    executivesManagers: data;
    governingMembers: data;
    year: number;
  }>;
  location: string;
  siren: string;
  title: string;
};

export const TileCompanyRepeqs = ({ entreprise, représentation_équilibrée }: RepeqType) => {
  const { département, région, raison_sociale, siren } = entreprise;

  const rowsDefault = 4;
  const [rowsNumber, setRowsNumber] = useState(rowsDefault);
  const handleMoreRows = () => {
    setRowsNumber(rowsNumber + rowsDefault);
  };

  const years = Object.keys(représentation_équilibrée)
    .map(year => Number(year))
    .sort()
    .reverse();

  return (
    <TileCompany>
      <TileCompanyTitle>{raison_sociale}</TileCompanyTitle>
      <TileCompanySiren>{siren}</TileCompanySiren>
      <TileCompanyLocation>
        {région}, {département}
      </TileCompanyLocation>
      <TileCompanyTable>
        <TileCompanyTableHead>
          <TileCompanyTableHeadCol>Année</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Cadres dirigeants</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Membres instance dirigeante</TileCompanyTableHeadCol>
        </TileCompanyTableHead>
        <TileCompanyTableBody>
          {years
            .map(year => ({ year, ...représentation_équilibrée[year] }))
            .slice(0, rowsNumber)
            .map(row => (
              <TileCompanyTableBodyRow key={row.year}>
                <TileCompanyTableBodyRowCol>
                  <TileCompanyYear year={row.year} />
                </TileCompanyTableBodyRowCol>
                <TileCompanyTableBodyRowCol>
                  <TileCompanyPercent>
                    <TileCompanyPercentData number={row.pourcentage_femmes_cadres} legend="Femmes" />
                    <TileCompanyPercentData number={row.pourcentage_hommes_cadres} legend="Hommes" />
                  </TileCompanyPercent>
                </TileCompanyTableBodyRowCol>
                <TileCompanyTableBodyRowCol>
                  <TileCompanyPercent>
                    <TileCompanyPercentData number={row.pourcentage_femmes_membres} legend="Femmes" />
                    <TileCompanyPercentData number={row.pourcentage_hommes_membres} legend="Hommes" />
                  </TileCompanyPercent>
                </TileCompanyTableBodyRowCol>
              </TileCompanyTableBodyRow>
            ))}
        </TileCompanyTableBody>
      </TileCompanyTable>
      {rowsNumber < years?.length && <TileCompanyLoadMore onClick={handleMoreRows} />}
    </TileCompany>
  );
};
