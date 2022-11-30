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

export const TileCompanyRepeqs = ({ location, title, siren, data }: TileCompanyRepeqsProps) => {
  const rowsNumberStepper = 4;
  const [rowsNumber, setRowsNumber] = useState(rowsNumberStepper);
  const handleMoreRow = () => {
    setRowsNumber(rowsNumber + rowsNumberStepper);
  };
  return (
    <TileCompany>
      <TileCompanyTitle>{title}</TileCompanyTitle>
      <TileCompanySiren>{siren}</TileCompanySiren>
      <TileCompanyLocation>{location}</TileCompanyLocation>
      <TileCompanyTable>
        <TileCompanyTableHead>
          <TileCompanyTableHeadCol>Année</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Cadres dirigeants</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Membres instance dirigeante</TileCompanyTableHeadCol>
        </TileCompanyTableHead>
        <TileCompanyTableBody>
          {data.slice(0, rowsNumber).map((row, index) => (
            <TileCompanyTableBodyRow key={index}>
              <TileCompanyTableBodyRowCol>
                <TileCompanyYear year={row.year} />
              </TileCompanyTableBodyRowCol>
              <TileCompanyTableBodyRowCol>
                <TileCompanyPercent>
                  <TileCompanyPercentData number={row.executivesManagers.women} legend="Femmes" />
                  <TileCompanyPercentData number={row.executivesManagers.men} legend="Hommes" />
                </TileCompanyPercent>
              </TileCompanyTableBodyRowCol>
              <TileCompanyTableBodyRowCol>
                <TileCompanyPercent>
                  <TileCompanyPercentData number={row.governingMembers.women} legend="Femmes" />
                  <TileCompanyPercentData number={row.governingMembers.men} legend="Hommes" />
                </TileCompanyPercent>
              </TileCompanyTableBodyRowCol>
            </TileCompanyTableBodyRow>
          ))}
        </TileCompanyTableBody>
      </TileCompanyTable>
      {rowsNumber < data?.length && <TileCompanyLoadMore onClick={handleMoreRow} />}
    </TileCompany>
  );
};
