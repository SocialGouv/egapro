"use client";

import { NotComputableReasonExecutiveRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonExecutiveRepEq";
import { NotComputableReasonMemberRepEq } from "@common/core-domain/domain/valueObjects/declaration/indicators/NotComputableReasonMemberRepEq";
import { type SearchRepresentationEquilibreeResultDTO } from "@common/core-domain/dtos/SearchRepresentationEquilibreeDTO";
import { addressLabel } from "@common/dict";
import { DebugButton } from "@components/utils/debug/DebugButton";
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
} from "../TileCompany";

export const TileCompanyRepeqs = (dto: SearchRepresentationEquilibreeResultDTO) => {
  const {
    company: { county, region, name, siren, countryIsoCode },
    results,
  } = dto;

  const rowsDefault = 4;
  const [rowsNumber, setRowsNumber] = useState(rowsDefault);
  const handleMoreRows = () => {
    setRowsNumber(rowsNumber + rowsDefault);
  };

  const years = Object.keys(results)
    .map(year => Number(year))
    .sort()
    .reverse();

  const address = addressLabel({ county, region, country: countryIsoCode });

  return (
    <TileCompany>
      <TileCompanyTitle>
        <DebugButton obj={dto} infoText="TileCompanyIndex" />
        {name}
      </TileCompanyTitle>
      <TileCompanySiren>{siren}</TileCompanySiren>
      {address && <TileCompanyLocation>{address}</TileCompanyLocation>}
      <TileCompanyTable>
        <TileCompanyTableHead>
          <TileCompanyTableHeadCol>Année</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Cadres dirigeants</TileCompanyTableHeadCol>
          <TileCompanyTableHeadCol size="md">Membres instances dirigeantes</TileCompanyTableHeadCol>
        </TileCompanyTableHead>
        <TileCompanyTableBody>
          {years
            .map(year => ({ year, ...results[year] }))
            .slice(0, rowsNumber)
            .map(row => (
              <TileCompanyTableBodyRow key={row.year}>
                <TileCompanyTableBodyRowCol>
                  <TileCompanyYear year={row.year + 1} />
                </TileCompanyTableBodyRowCol>
                <TileCompanyTableBodyRowCol>
                  {row.notComputableReasonExecutives ? (
                    <TileCompanyPercent>
                      <TileCompanyPercentData
                        number={null}
                        legend={NotComputableReasonExecutiveRepEq.Label[row.notComputableReasonExecutives]}
                      />
                    </TileCompanyPercent>
                  ) : (
                    <TileCompanyPercent>
                      <TileCompanyPercentData number={row.executiveWomenPercent} legend="Femmes" />
                      <TileCompanyPercentData number={row.executiveMenPercent} legend="Hommes" />
                    </TileCompanyPercent>
                  )}
                </TileCompanyTableBodyRowCol>
                <TileCompanyTableBodyRowCol>
                  {row.notComputableReasonMembers ? (
                    <TileCompanyPercent>
                      <TileCompanyPercentData
                        number={null}
                        legend={NotComputableReasonMemberRepEq.Label[row.notComputableReasonMembers]}
                      />
                    </TileCompanyPercent>
                  ) : (
                    <TileCompanyPercent>
                      <TileCompanyPercentData number={row.memberWomenPercent} legend="Femmes" />
                      <TileCompanyPercentData number={row.memberMenPercent} legend="Hommes" />
                    </TileCompanyPercent>
                  )}
                </TileCompanyTableBodyRowCol>
              </TileCompanyTableBodyRow>
            ))}
        </TileCompanyTableBody>
      </TileCompanyTable>
      {rowsNumber < years?.length && <TileCompanyLoadMore onClick={handleMoreRows} />}
    </TileCompany>
  );
};
